# Phase 1 — Scaffold + Fake Host Page + Design Identity

**Goal:** a running Next.js app, the full folder skeleton, and a genuinely convincing fake "Acme Coffee" landing page — this is what you'll screenshot with the widget floating on it at the very end. No AI, no widget logic yet.

Prerequisite: [Phase 0](02-phase-0-prerequisites.md) complete (Node 20+, Groq key, repo, your 10 facts).

---

## What you're building and why

Two things, and they're both worth taking seriously even though neither has AI in it yet:

1. **The folder skeleton** — every file every later phase will fill in. Getting this right now means every later phase prompt can say "open `lib/ai.ts`" instead of "create a new file called..." — much less room for an AI assistant to invent its own structure that drifts from the plan.
2. **The fake host page** — this is not throwaway scaffolding. It is your **gig thumbnail**. A freelance chatbot-widget portfolio piece lives or dies on whether the "before" page looks like a real small business, not a bootstrap template with lorem ipsum. Spend real effort here.

---

## Step-by-step

### 1. Scaffold the app

From inside your empty `ai-chatbot-widget` repo:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*"
```

Answer prompts: App Router = yes. When it finishes:

```bash
npm run dev
```

Confirm `http://localhost:3000` loads the default Next.js starter page before doing anything else — this is your baseline that everything works before you start customizing.

### 2. Create the folder skeleton

Create these as empty (or near-empty) stub files — don't worry about real content yet except where noted:

```
app/embed/page.tsx
app/api/chat/route.ts
public/widget.js
bots/acme-coffee.json
bots/_schema.md
components/ChatWindow.tsx
components/MessageBubble.tsx
components/BubbleButton.tsx
lib/ai.ts
lib/bots.ts
lib/config.ts
```

A stub file can be as simple as a comment saying what it'll hold, e.g.:

```ts
// lib/ai.ts — model provider calls live here. Built in Phase 3.
```

The exception is `lib/config.ts`, which should be real from the start (nothing else depends on it changing later):

```ts
// lib/config.ts
export const CHAT_MODEL = "llama-3.1-8b-instant"; // Groq, free tier — see docs/00-model-landscape.md
export const MAX_MESSAGE_LENGTH = 500;
export const RATE_LIMIT_PER_MIN = 20;
```

### 3. Write `bots/_schema.md` and `bots/acme-coffee.json`

`_schema.md` documents the shape so any future bot config (including the second one you'll add in Phase 7) follows the same contract:

```markdown
# Bot config schema

Each file in `bots/` is one business, named `<bot-id>.json`. `bot-id` is the exact string a client
puts in `data-bot-id="..."` on their embed script tag.

| field | type | required | notes |
|---|---|---|---|
| id | string | yes | must match the filename (without .json) |
| name | string | yes | shown in the chat header |
| accentColor | string (hex) | yes | themes the widget bubble + header |
| knowledge | string | yes | plain-text business facts, fed verbatim into the system prompt |
```

`bots/acme-coffee.json` — this is where your Phase 0 facts go, e.g.:

```json
{
  "id": "acme-coffee",
  "name": "Acme Coffee",
  "accentColor": "#6F4E37",
  "knowledge": "Acme Coffee is located at 214 Maple Street, Riverside. Hours: Mon-Fri 6:30am-6pm, Sat-Sun 7am-4pm. Phone: (555) 210-8842. Menu highlights: House Espresso $3.50, Oat Milk Latte $5.25, Cinnamon Roll $4.00, Avocado Toast $8.50, Cold Brew $4.75. We roast our own beans in-house every Tuesday. Free wifi, dog-friendly patio seating. We do not offer delivery, but we do take catering orders for groups of 10+ with 48 hours notice. Gift cards available in store only, cash or card, no online gift card sales yet."
}
```

Use *your own* facts from Phase 0, not this placeholder text verbatim — the specificity is the point.

### 4. Design and build the fake landing page (`app/page.tsx`)

This is the phase's real design work. Directions:

- **Pick one deliberate visual identity** for Acme Coffee: a warm, specific palette (the `accentColor` from the JSON above is a good anchor), a real font pairing loaded via `next/font` (e.g. a serif display font for headings + a clean sans body font — avoid the default system font stack, it reads as "unstyled").
- **Structure**: hero (name, tagline, a strong first impression — this is the "hero" for your own screenshot too), a menu-highlights section pulling from the same facts you wrote, an hours/location section, a footer.
- **Make it responsive** — check it at a phone width, not just desktop.
- **Accessibility basics**: visible focus outlines (don't use `outline: none` without replacing it), sufficient color contrast on text over your accent color, semantic HTML (`<nav>`, `<main>`, `<footer>`, heading hierarchy that makes sense).

Don't add the widget script tag yet — that's Phase 6. Right now this page just needs to look like a real small business's website on its own.

### 5. `.env.example` and starter `README.md`

`.env.example`:

```
GROQ_API_KEY=
```

`README.md` — a few starter sections (what this project is, local setup, this gets filled in fully in Phase 8): project name, one-line description, `npm install && npm run dev` instructions, and a placeholder "Embed snippet" section you'll complete later.

---

## The prompt to paste to your AI coding assistant

> **CONTEXT:** I'm building an embeddable AI chatbot widget as a freelance portfolio demo. A website owner adds one `<script>` tag and a chat bubble appears that answers questions about their business. Stack: Next.js 14 (App Router) + TypeScript + Tailwind. The model provider is **Groq's free API** (`llama-3.1-8b-instant`), accessed via the OpenAI SDK pointed at Groq's `baseURL` — not OpenAI directly. This is Phase 1 of 8: scaffold + a convincing fake demo host page. No widget or AI logic yet.
>
> **DESIGN DIRECTION:** Two design jobs here. (a) The fake host page ("Acme Coffee") should look like a real small-business site — warm, inviting, specific to a coffee shop, not a generic template. (b) Later the widget will sit on it. Pick a deliberate visual identity for Acme (color, a real font pairing via next/font, hero with genuine coffee-shop character). Responsive, accessible, visible focus states.
>
> **BUILD THIS PHASE:**
> 1. Scaffold Next.js 14 App Router + TS + Tailwind, project `ai-chatbot-widget`.
> 2. Create the folder structure with stub files: `app/embed/page.tsx`, `app/api/chat/route.ts`, `public/widget.js`, `bots/acme-coffee.json`, `bots/_schema.md`, `components/ChatWindow.tsx`, `components/MessageBubble.tsx`, `components/BubbleButton.tsx`, `lib/ai.ts`, `lib/bots.ts`, `lib/config.ts`.
> 3. `lib/config.ts`: export `CHAT_MODEL = "llama-3.1-8b-instant"`, `MAX_MESSAGE_LENGTH` (500), `RATE_LIMIT_PER_MIN` (20).
> 4. `bots/acme-coffee.json`: a bot config with `id`, `name`, `accentColor`, and `knowledge` — I'll paste my ~10 facts. Document the shape in `bots/_schema.md`.
> 5. `app/page.tsx`: a polished fake "Acme Coffee" landing page (hero, menu highlights, hours, location, footer). Make it look real and specific.
> 6. `.env.example` with `GROQ_API_KEY`. Starter `README.md`.
>
> **CONSTRAINTS:** No AI calls, no widget injection yet. Minimal dependencies (no Pinecone/LangChain). Give exact install + run commands; confirm `npm run dev` works.

---

## Key concepts introduced this phase

- **Why stub files first:** later phases prompt an AI assistant to "open and fill in" a named file rather than "invent a file" — this keeps a multi-session build coherent, since a fresh chat that only sees the current phase's prompt won't accidentally restructure things.
- **Why the fake page matters as much as the real widget:** in a services/portfolio context, the "before" (a real-looking client site) is what makes the "after" (bubble appears, answers questions) legible as a product to a non-technical viewer.

---

## Definition of done

- [ ] `npm run dev` shows a believable Acme Coffee site, responsive, with a deliberate visual identity
- [ ] All stub files/folders exist matching [the target folder structure](01-architecture-overview.md#folder-structure-target-end-state)
- [ ] `bots/acme-coffee.json` holds your real facts from Phase 0; `_schema.md` documents the shape
- [ ] `lib/config.ts` has the tunables, referencing the Groq model name
- [ ] `.env.example` references `GROQ_API_KEY`, not `OPENAI_API_KEY`
- [ ] Committed to git: `git add -A && git commit -m "Phase 1: scaffold + fake Acme Coffee host page"`

Next: [04-phase-2-bot-config-loader.md](04-phase-2-bot-config-loader.md)
