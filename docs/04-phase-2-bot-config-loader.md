# Phase 2 — Bot Config Loader

**Goal:** `lib/bots.ts` loads and validates a bot config by `botId`, with a clear error for unknown bots. Pure logic, no AI, no network calls.

Prerequisite: [Phase 1](03-phase-1-scaffold-and-host-page.md) complete.

---

## What you're building and why

Every later phase calls `getBot(botId)` and trusts it either returns a fully valid `BotConfig` or throws a specific, recognizable error. This phase is small on purpose — it's the one place in the app that knows knowledge currently comes from a JSON file on disk, so that fact can change later (database, CMS, RAG pipeline) without any caller needing to know or care.

This matters more than "just read a JSON file" sounds like, for one concrete reason: **`botId` comes from the outside world.** It arrives as a query string on `/embed?botId=...` and as a field in the `/api/chat` POST body — both of which are values a browser (eventually, anyone) controls. If `getBot` doesn't validate strictly, a malformed or malicious `botId` (e.g. `../../../etc/passwd`, or an id with no matching file) can produce a confusing crash deep in the API route instead of a clean, immediate error at the one place responsible for resolving it. Validating at this boundary is exactly the kind of defensive step that belongs at a system boundary — see the guidance on only validating where untrusted input enters.

---

## Step-by-step

### 1. Define the `BotConfig` type and validation

Use `zod` (or hand-written checks, but zod is one dependency and pays for itself here) to validate the shape documented in `bots/_schema.md`: `id`, `name`, `accentColor`, `knowledge`, all required strings.

### 2. Write `getBot(botId: string): BotConfig`

Behavior:
- Reject a `botId` that isn't a simple filename-safe string (letters, numbers, hyphens) *before* touching the filesystem — this is what closes off the path-traversal concern above. A regex like `/^[a-z0-9-]+$/` is enough.
- Look for `bots/<botId>.json`. If it doesn't exist, throw a typed `UnknownBotError` (not a generic `Error` — later phases, especially the API route in Phase 4, need to tell "bot doesn't exist" apart from "something else broke" so they can return the right HTTP status and message).
- Parse the file's JSON, validate against the schema. If parsing or validation fails, also throw `UnknownBotError` (or a sibling `InvalidBotConfigError`) — from the caller's point of view, a broken config file is just as unusable as a missing one.
- On success, return the validated `BotConfig`.

### 3. A comment noting the future swap point

Somewhere near `getBot`, leave a short comment marking where a database/CMS lookup would replace the file read — not a speculative abstraction, just a marker so future-you (or a client's next developer) knows this is the intended seam.

### 4. `scripts/test-bot.ts` — a throwaway manual test

No test framework needed yet, just a script you run with `npx tsx scripts/test-bot.ts` (or `ts-node`) that:
- Loads `acme-coffee` and prints its `name`, `accentColor`, and the first ~100 characters of `knowledge`.
- Tries `getBot("does-not-exist")` in a `try/catch` and prints that it threw `UnknownBotError` cleanly (not an unhandled crash with a scary stack trace).

---

## The prompt to paste to your AI coding assistant

> **CONTEXT RECAP:** Embeddable AI chatbot widget, Next.js 14 + TS + Tailwind. Phase 1 done (scaffold + fake Acme host page + `bots/acme-coffee.json`). Model provider will be Groq's free API in Phase 3 — not relevant yet. Phase 2 of 8: the bot config loader in `lib/bots.ts`. No AI yet.
>
> **BUILD THIS PHASE:**
> 1. `lib/bots.ts`: `getBot(botId: string): BotConfig` that first validates `botId` is a simple filename-safe string (reject anything else immediately, to close off path-traversal), then reads the matching `bots/<botId>.json`, validates required fields (`id`, `name`, `accentColor`, `knowledge`) with a typed schema (zod or manual), and throws a typed `UnknownBotError` if the id is invalid, the file is missing, or the config fails validation.
> 2. Export the `BotConfig` type.
> 3. A throwaway `scripts/test-bot.ts` that loads `acme-coffee` and prints its name, accent color, and a snippet of the knowledge — and tries an unknown id to confirm it errors cleanly (caught, typed, not a raw crash).
>
> **CONSTRAINTS:** Pure file-based loading for now; architect so the source could later be a database (add a short comment noting where that swap would go — don't build the abstraction now, just mark the seam). No AI, no network. Validate `botId` before it touches the filesystem.

---

## Key concepts introduced this phase

- **Typed errors at a system boundary.** `UnknownBotError` isn't over-engineering — it's the difference between the API route in Phase 4 being able to say "404, unknown bot" versus leaking a generic 500 with an internal stack trace to whoever's calling your public API from their website.
- **Input validation only where untrusted input enters.** `botId` is untrusted (it comes from a URL query string and a request body); `bots/acme-coffee.json`'s *filename* is not (you wrote it) — but its *contents* still get schema-validated, because a typo in the JSON should fail loudly at load time, not silently produce `undefined` deep inside a prompt template in Phase 3.

---

## Definition of done

- [ ] `scripts/test-bot.ts` prints Acme's config correctly
- [ ] The same script shows `getBot("does-not-exist")` throwing `UnknownBotError`, caught and printed cleanly — not an unhandled crash
- [ ] `getBot` rejects a `botId` containing `/`, `..`, or other non-filename-safe characters before reading any file
- [ ] `BotConfig` type + validation in place, matching `bots/_schema.md`
- [ ] Committed to git: `git commit -m "Phase 2: bot config loader with validation"`

Next: [05-phase-3-ai-layer.md](05-phase-3-ai-layer.md)
