# Phase 5 — The Chat UI Inside the Iframe (`/embed`)

**Goal:** the actual chat interface, rendered at `/embed?botId=...`, designed from the ground up to live inside an iframe. It reads the `botId`, themes itself with the bot's accent color, and talks to `/api/chat`.

Prerequisite: [Phase 4](06-phase-4-chat-api-cors.md) complete (`/api/chat` streams a grounded answer, verified via curl).

---

## What you're building and why

Up to now, everything has been testable with `curl` and a Node script. This phase is the first thing a human actually looks at and talks to. It's also the piece that has to hold up under a constraint the rest of the app doesn't: **it will be rendered inside a small iframe on someone else's site**, at a fixed, small size, and it has to look intentional there — not like a full page squeezed into a box.

### Why a separate `/embed` route instead of reusing `app/page.tsx`

`app/page.tsx` (the fake Acme host page) and `/embed` (the chat UI) are different products for different viewports and different trust contexts. `/embed` assumes nothing about what's around it — no shared header, no shared nav, no assumption about the parent page's layout — because in production it never has any of that; it's alone inside its iframe. Keeping it a fully separate route makes that isolation explicit in the code, not just in your head.

---

## Step-by-step

### 1. Read `botId` and get the bot's branding

`/embed?botId=acme-coffee` needs the bot's `name` and `accentColor` to theme itself (header color, bubble accent) before it can render anything meaningful. Two ways to get this:
- **A small `GET /api/bot-meta?botId=...` endpoint** that returns just `{ name, accentColor }` (not the full knowledge blob).
- **What we actually built:** since `app/embed/page.tsx` is a Next.js Server Component, it can call `getBot(botId)` directly on the server and pass just `{ name, accentColor }` down as props to the client `ChatWindow` — no extra API route needed at all. This is simpler than the `bot-meta` endpoint above (one fewer network round trip, one fewer file to maintain) while giving the identical guarantee: the browser only ever sees `name`/`accentColor`, never the full `knowledge` string, since that never leaves the server.
- Threading the values through the query string directly from `widget.js` in Phase 6 remains the one option to avoid — it couples the loader script to branding details and would make rebranding (Phase 7) require touching the loader instead of just the bot's JSON file.

### 2. Build `ChatWindow`

Pieces:
- **Header**: bot name, a small avatar/icon, themed with `accentColor`.
- **Scrollable message list**: auto-scrolls to the latest message as new tokens arrive.
- **Input + send**: disabled while a request is in flight; disabled on empty input; enforces the same `MAX_MESSAGE_LENGTH` client-side as a UX nicety (the server still enforces it as the real guard).
- **On submit**: `POST` to `/api/chat` with `{ botId, question, history }`, where `history` is the last several turns of the conversation kept in component state. Read the response body incrementally (matching whatever Phase 4 chose — SSE or chunked text) and append tokens to the current bot message as they arrive, so the message visibly grows/types rather than popping in all at once.
- **States to handle explicitly**: initial greeting on load ("Hi! Ask me anything about Acme Coffee"), a "thinking" indicator between send and first token, the streaming-in-progress state, a clean error state (network failure, server error) written in the bot's voice rather than a raw error string, and the disabled-empty-input state.

### 3. Build `MessageBubble`

User messages align right, bot messages align left, distinct but harmonious styling (use the bot's `accentColor` for the user's bubble or the header — pick one consistent scheme), optional timestamps, readable line length and font size at the small widths this will actually render at.

### 4. Size for the iframe, not for a normal page

Design and test at roughly **380px wide × 560px tall** (a typical chat-widget iframe size) — that's the real production context. Separately, make sure it also works full-screen at mobile widths, since Phase 6's loader will likely make the iframe full-screen on small viewports rather than a fixed small box.

### 5. Respect motion and accessibility preferences

`prefers-reduced-motion` should disable/simplify any typing-indicator animation. Keep focus states visible on the input and send button — this UI will be used by real site visitors, not just you.

---

## The prompt to paste to your AI coding assistant

> **CONTEXT RECAP:** Embeddable AI chatbot widget, Next.js 14 + TS + Tailwind. Backend works: `/api/chat` streams grounded answers for a botId (CORS-enabled, using Groq's free API under the hood — not relevant to this phase). Phase 5 of 8: the chat UI at `app/embed/page.tsx` (plus `ChatWindow`, `MessageBubble`), which will be loaded INSIDE an iframe on client sites.
>
> **BUILD THIS PHASE:**
> 1. `app/embed/page.tsx` reads `botId` from the query string. Add a small `GET /api/bot-meta?botId=...` endpoint returning just `{ name, accentColor }` (reuse `getBot` from `lib/bots.ts`, don't expose the full `knowledge` field to the client) and have `/embed` fetch it to theme the header with the bot's accent color.
> 2. `ChatWindow`: header (bot name + avatar), scrollable message list, input + send. On submit, POST to `/api/chat`, render the streamed answer token-by-token with a typing indicator, matching whatever streaming format Phase 4 used. Keep conversation in state and send recent `history` (last 6-10 messages) with each request.
> 3. `MessageBubble`: user right, bot left, clean bubbles themed with the bot's accent color, timestamps optional.
> 4. States: initial greeting ("Hi! Ask me anything about {botName}"), thinking, streaming, error (written in a friendly voice, not a raw error), empty input disabled.
> 5. The page must look good at a small iframe size (~380×560px) and go full-screen on mobile widths.
> 6. Respect `prefers-reduced-motion`; keep visible focus states on the input and send button.
>
> **CONSTRAINTS:** This page renders inside an iframe in production — no host-page assumptions (no shared nav/header, no assumption about surrounding layout). Consume the stream incrementally in the browser, not by waiting for the full response. Keep the design consistent and polished at the actual iframe size, not just on a full desktop viewport.

---

## Key concepts introduced this phase

- **Consuming a streamed fetch response in the browser.** The `ChatWindow` needs to read `response.body` as a stream (e.g. via `getReader()` on a `ReadableStream`, or `EventSource`/manual SSE parsing if Phase 4 chose SSE) and update UI state as each chunk arrives — this is genuinely different from a normal `await response.json()` flow and is worth understanding rather than copy-pasting.
- **Designing for a fixed, small viewport as the primary target.** Most web UI work assumes "responsive, but desktop-first." This component's *actual* primary viewport is a ~380×560 box — designing there first and expanding to mobile-full-screen second (rather than the usual desktop-first-then-cram-into-mobile approach) produces a better result here.
- **Not shipping more data than the client needs.** Whether via a `bot-meta` endpoint or (as built here) a Server Component doing the `getBot()` lookup itself, only `{ name, accentColor }` ever reaches the browser — never the full `knowledge` blob. The business's internal facts should only ever be used server-side to construct the model prompt, not handed to any client that asks.

---

## Definition of done

- [ ] Visiting `http://localhost:3000/embed?botId=acme-coffee` directly (no iframe, just the URL) shows a working, themed chat that streams answers
- [ ] The header color matches `acme-coffee.json`'s `accentColor`
- [ ] Looks right at ~380×560px and at a mobile viewport width
- [ ] Follow-up questions get answered with the earlier turns as context (test: ask "what are your hours" then "and on weekends?")
- [ ] An unanswerable/unrelated question shows a friendly decline, not a raw error or a fabricated answer
- [ ] Committed to git: `git commit -m "Phase 5: /embed chat UI"`

Next: [08-phase-6-widget-loader-script.md](08-phase-6-widget-loader-script.md)
