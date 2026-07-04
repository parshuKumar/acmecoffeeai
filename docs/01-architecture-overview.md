# Architecture Overview

Read this once before Phase 1. It explains the *why* behind every structural decision so that when a phase doc says "do X," you know what it's protecting.

---

## What we're building, in one sentence

A website owner pastes one `<script>` tag into their site, and a chat bubble appears that answers questions about *their specific business*, using an AI model, without ever touching or breaking their site's existing look and feel.

## The three moving parts

```
┌─────────────────────────────┐     ┌──────────────────────────────┐     ┌─────────────────────┐
│  CLIENT'S WEBSITE            │     │  YOUR APP (Next.js/Vercel)    │     │  MODEL PROVIDER      │
│  (WordPress, Shopify, plain  │     │                                │     │  (Groq, free tier)   │
│   HTML — you don't control   │     │  /public/widget.js  (loader)  │     │                       │
│   this)                      │     │  /embed              (chat UI)│     │                       │
│                               │     │  /api/chat           (backend)│     │                       │
│  <script src=".../widget.js" │────▶│                                │     │                       │
│   data-bot-id="acme-coffee"> │     │                                │     │                       │
└─────────────────────────────┘     └──────────────────────────────┘     └─────────────────────┘
```

1. **`widget.js`** — a small vanilla-JS file the client's browser downloads. It draws a floating bubble and, on click, injects an `<iframe>` pointing at your `/embed` page. This is the *only* thing that ever touches the host page's DOM.
2. **`/embed`** — a normal Next.js page, but designed to live inside that iframe. It's the actual chat window (message list, input box). It talks to your backend over `fetch`.
3. **`/api/chat`** — a Next.js API route. Given a `botId` and a `question`, it looks up that business's knowledge, asks the model to answer *only* from that knowledge, and streams the answer back token-by-token.

Everything downstream of "client pastes a script tag" is code you own end-to-end. Everything upstream (the host page's HTML/CSS/JS) is a black box you must never depend on or interfere with.

---

## Why an iframe, specifically

This is the single most important design decision in the whole project, and it's worth being able to explain confidently, because clients and other developers will ask.

**The problem:** if you just injected a `<div>` with your chat UI directly into the host page's DOM, two things can go wrong in either direction:
- The host page's global CSS (`* { margin: 0 }`, a CSS reset, a `button { all: unset }` rule, a fixed-position modal library, a font override) leaks into your widget and makes it look broken.
- Your widget's CSS/JS leaks out and breaks *their* page (a global class name collision, a script that conflicts with their jQuery version, an ID collision).

**The fix:** an `<iframe>` is a completely separate browsing context. It has its own DOM, its own CSSOM, its own JS global scope. Nothing crosses that boundary except what you explicitly allow (URL parameters, and later `postMessage` if you need two-way communication). This is the same mechanism ad networks, payment widgets (Stripe Elements), and comment systems (Disqus) use for exactly this reason — you're in good, well-precedented company architecturally.

**The trade-off you're accepting:** iframes are heavier than injecting a plain `<div>` (a full nested browsing context, another network request, no automatic access to the parent page's fonts/scroll position). For a chat widget that opens once per session and stays open, this cost is negligible. It would matter more for something that needed to be injected hundreds of times per page.

**The alternative, so you can name it if asked:** Shadow DOM (`element.attachShadow()`) gives you *style* isolation (the host's CSS can't leak in, yours can't leak out) but **not** JS isolation — a script error in your widget can still throw in the host page's console and, in rare cases, interfere with its execution. Shadow DOM is lighter-weight and is the right call for something like a design-system component library used *within your own app*. For a script tag dropped into an unknown WordPress theme by a non-technical client, the iframe's harder guarantee is worth the small overhead. Mentioning this trade-off explicitly is a good "I thought about the alternatives" signal in a client conversation or an interview.

---

## Why the loader script and the chat UI are separate things

`widget.js` (the loader) and `/embed` (the actual chat UI) are deliberately two different pieces of code, not one:

- `widget.js` has to run directly in the host page's `<head>` or `<body>`, as plain, dependency-free JavaScript, because you don't control what other scripts or frameworks are on that page. It has exactly one job: draw a bubble, and when clicked, create an iframe.
- `/embed` is a full Next.js page: it can use React, Tailwind, fetch, streaming — anything — because it runs *inside* the iframe, in its own isolated world, loaded from *your* server.

This split is what makes "one script tag" possible while still letting you build the actual chat interface with a real framework instead of hand-rolled DOM manipulation.

---

## Why knowledge is a per-bot JSON file, not a database (yet)

Each business's knowledge lives in `bots/<bot-id>.json`. The `id` in that file is the same string a client puts in `data-bot-id="acme-coffee"` on their `<script>` tag. This is what makes the system multi-tenant: one deployed app, many businesses, distinguished only by which config file `/api/chat` loads for a given request.

A JSON file is the right amount of engineering for a Basic-tier product:
- Onboarding a new client = writing one new JSON file. No migrations, no admin UI, no auth to build yet.
- It's trivially demonstrable ("look, adding a whole new business took one file") — this is your Phase 7 proof point.
- `lib/bots.ts` is the *only* place that knows knowledge comes from a file. When you outgrow this (a client wants to self-edit their own facts, or you want retrieval over a big PDF instead of ~10 hardcoded facts), you swap what's inside `getBot()` for a database call or a vector search — nothing else in the app needs to change, because everything else just calls `getBot(botId)` and gets a `BotConfig` back.

---

## Why the model call is isolated in `lib/ai.ts`

Same principle as above, applied to the AI provider instead of the knowledge source. `lib/ai.ts` exports one function, `streamBotAnswer(...)`. Nothing else in the codebase imports an AI SDK directly. This means:
- Swapping Groq → Gemini → OpenAI → Claude (see [00-model-landscape.md](00-model-landscape.md)) is a change to one file.
- You can unit-test the API route and the UI without needing a live model — they only depend on `streamBotAnswer`'s *shape* (an async stream of text), not its implementation.

---

## Why CORS matters here specifically

`/api/chat` is called from `/embed`, which is loaded inside an iframe, whose `src` points at your domain (e.g. `yourapp.vercel.app`) — but that iframe is embedded on the *client's* domain (e.g. `acmecoffee.com`). The browser treats "the page the user is looking at" (`acmecoffee.com`) and "the origin serving the iframe's content" (`yourapp.vercel.app`) as different origins for some purposes, but note: the `fetch` from inside `/embed` to `/api/chat` is actually **same-origin** (both are `yourapp.vercel.app`) *as long as `/embed` and `/api/chat` are served from the same app* — which they are here, since it's one Next.js deployment.

So why does the CORS phase exist at all? Two real reasons:
1. **Defense in depth / future-proofing:** if you ever split the widget UI and the API into different domains (a CDN-hosted `embed` vs. an API-only backend), same-origin stops being true, and you'll need CORS then. Building the header-handling now means the API is portable.
2. **The `OPTIONS` preflight and explicit headers are also what let you `curl` and test the API directly from a different tool/origin during development**, and what lets you honestly document "this API is embeddable cross-origin" as a feature, since browsers do enforce CORS the moment any *other* consumer (not your own `/embed` page) tries to call it from a different domain — e.g. if a client ever wanted to call `/api/chat` directly from their own custom UI instead of using your iframe.

Phase 4's doc explains the specific headers.

---

## The full request lifecycle, end to end

1. Client's page finishes loading; the browser executes `widget.js`.
2. `widget.js` reads its own `<script>` tag's `data-bot-id` and `src` (to derive your app's origin dynamically — see Phase 6).
3. `widget.js` draws a bubble button, absolutely positioned, high `z-index`, inline styles only.
4. Visitor clicks the bubble → `widget.js` creates an `<iframe src="https://yourapp.vercel.app/embed?botId=acme-coffee">` and shows it.
5. Inside the iframe, `/embed` renders `ChatWindow`, shows a greeting, and waits for input.
6. Visitor types a question → `ChatWindow` does `fetch('/api/chat', { method: 'POST', body: { botId, question, history } })`.
7. `/api/chat` validates the input, calls `getBot(botId)` (Phase 2) to load Acme's knowledge, calls `streamBotAnswer(...)` (Phase 3) with a strict system prompt, and streams the response back as it's generated.
8. `ChatWindow` reads the stream incrementally and renders tokens as they arrive, so the answer appears to "type" in real time.

Every phase from here builds exactly one of these numbered steps. Keep this diagram in mind — each phase doc will point back to where it fits.

---

## Folder structure (target end state)

```
ai-chatbot-widget/
├── app/
│   ├── page.tsx                 # fake "Acme Coffee" landing page with the widget embedded
│   ├── embed/
│   │   └── page.tsx             # chat UI that renders INSIDE the iframe
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── chat/route.ts        # botId + question → knowledge lookup → streamed answer (CORS enabled)
│       └── bot-meta/route.ts    # small public endpoint: botId → {name, accentColor} for theming /embed
├── public/
│   └── widget.js                # the loader script clients paste (bubble + iframe injector)
├── bots/
│   ├── acme-coffee.json         # per-bot knowledge + branding
│   ├── bright-dental.json       # second bot, added in Phase 7 to prove multi-tenancy
│   └── _schema.md                # what fields a bot config has
├── components/
│   ├── ChatWindow.tsx
│   ├── MessageBubble.tsx
│   └── BubbleButton.tsx
├── lib/
│   ├── ai.ts                    # ALL model-provider calls — the one file you swap for a different model
│   ├── bots.ts                  # load + validate a bot config by botId
│   └── config.ts                # model name, provider base URL, limits, tunables
├── scripts/
│   ├── test-bot.ts              # Phase 2 throwaway test
│   └── test-ai.ts               # Phase 3 throwaway test
├── .env.example
├── .env.local                   # gitignored — holds your real GROQ_API_KEY
├── README.md
└── package.json
```

---

## Tech decisions (fixed for this build)

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) + TypeScript | UI (demo host page + embed) + API in one deployable app |
| Widget delivery | A standalone JS file (`/widget.js`) that injects an **iframe** | Full isolation — see the section above |
| Widget UI | A separate route (`/embed`) rendered inside the iframe, Tailwind-styled | Just a normal web page, loaded in an iframe |
| Styling | Tailwind CSS | Fast, consistent |
| Knowledge source | Per-bot JSON keyed by `bot-id` | Basic tier; architected so it can become a database or RAG pipeline later without touching callers |
| Model provider | **Groq**, `llama-3.1-8b-instant` (free tier, OpenAI-SDK compatible) | See [00-model-landscape.md](00-model-landscape.md) for the full comparison and reasoning |
| Streaming | Streamed `Response` (chunked text / SSE) | Token-by-token typing effect |
| Cross-origin | CORS on the API | The widget's iframe content and API are same-origin today, but the API is built to be safely callable cross-origin from the start |

**Model-swap note:** every model call lives in `lib/ai.ts`. To swap providers, you change `lib/config.ts` (model name + base URL) and the client construction at the top of `lib/ai.ts` — nothing else in the app changes.
