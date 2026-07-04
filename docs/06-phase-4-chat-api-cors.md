# Phase 4 — Chat API Endpoint (with CORS)

**Goal:** `POST /api/chat` takes `{ botId, question, history? }`, loads the bot, streams a grounded answer. CORS is enabled because the widget is designed to be callable from a different domain than the one serving the API.

Prerequisite: [Phase 3](05-phase-3-ai-layer.md) complete (`getBot` and `streamBotAnswer` both work standalone).

---

## What you're building and why

This route is where the two pure-logic pieces from Phases 2 and 3 (`getBot`, `streamBotAnswer`) get wired into something a browser can actually call. It's also where you handle the two realities of a public-facing API: **untrusted input** (anyone can POST anything here) and **cross-origin calls** (see the CORS explanation below).

## Recap: why CORS matters here (from the architecture doc)

`/embed` and `/api/chat` are served from the same Next.js app, so the `fetch` call from inside the iframe to your API is same-origin *today*. CORS handling is built anyway because:
1. It future-proofs the API if the widget UI and backend ever get split onto different domains.
2. It's what makes it honest to tell a client "this API is safe to call from your embedded widget on your domain" — the moment anything other than your own `/embed` page calls it from a different origin (a custom client integration, your own testing tools), the browser *will* enforce CORS, and you want the right headers already in place rather than debugging it under pressure later.

---

## Step-by-step

### 1. Validate the request body

- `botId`: required, non-empty string (deeper validation, like the filename-safe check, already happens inside `getBot` from Phase 2 — don't duplicate it here, just make sure it's present).
- `question`: required, non-empty, trimmed, and under `MAX_MESSAGE_LENGTH` (from `lib/config.ts`). Reject with a `400` and a friendly JSON error otherwise — this is also your first line of defense against someone trying to send a huge payload to run up token usage.
- `history`: optional array; if present, validate it's an array of `{role, content}` objects and cap how many entries you'll actually forward to `streamBotAnswer` (e.g. last 6-10 messages) regardless of what's sent.

### 2. Wire the pipeline

```
getBot(botId)  →  streamBotAnswer({ botName: bot.name, knowledge: bot.knowledge, question, history })  →  stream back to the client
```

Return a streamed `Response` (Next.js Route Handlers support returning a `ReadableStream` directly as the response body) with `Content-Type: text/event-stream` (SSE) or a plain chunked `text/plain` — either works; SSE is the more conventional choice if you want to attach event types later (e.g. a distinct `error` event mid-stream), plain chunked text is simpler if you just want raw tokens. Pick one and keep Phase 5's fetch-consuming code matching it.

### 3. Handle the `OPTIONS` preflight and set CORS headers

A browser sends an `OPTIONS` preflight before certain cross-origin requests (this one qualifies because it's a POST with a JSON content-type). Your route needs to:
- Respond to `OPTIONS` with a `204`/`200` and the headers below, no body.
- On the real `POST` response, include:
  - `Access-Control-Allow-Origin: *` (permissive is fine for this demo — a comment should note that a production, paying-client version would allowlist specific domains per `botId`, since at that point you'd know exactly which domain each client's widget runs on).
  - `Access-Control-Allow-Methods: POST, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type`

### 4. Error handling, mapped to clean HTTP responses

- Unknown `botId` (caught `UnknownBotError` from Phase 2) → `404` with `{ error: "Unknown bot" }`.
- Empty/too-long question → `400` with a friendly message.
- The model call itself fails (network issue, Groq outage, retries exhausted) → `502` or `500` with a friendly message — never leak a raw stack trace or the underlying SDK's error object to the response body, since this is a public endpoint.

### 5. Manual verification

Two `curl` checks:

**A grounded streamed answer:**
```bash
curl -N -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"botId":"acme-coffee","question":"What are your weekend hours?"}'
```
`-N` disables curl's output buffering so you can watch the stream arrive incrementally rather than all at once at the end.

**A cross-origin preflight:**
```bash
curl -i -X OPTIONS http://localhost:3000/api/chat \
  -H "Origin: https://some-other-site.example" \
  -H "Access-Control-Request-Method: POST"
```
Confirm the response includes the `Access-Control-Allow-*` headers from step 3.

---

## The prompt to paste to your AI coding assistant

> **CONTEXT RECAP:** Embeddable AI chatbot widget, Next.js 14 + TS. Phases 1–3 done: `lib/bots.ts` (`getBot`) and `lib/ai.ts` (`streamBotAnswer`, using Groq's free API) both work. Phase 4 of 8: the API route `app/api/chat/route.ts`. This endpoint is designed to be called cross-origin from a widget embedded on other websites eventually, so CORS matters even though `/embed` and this API are same-origin today.
>
> **BUILD THIS PHASE:**
> 1. `POST /api/chat`, body `{ botId, question, history? }`. Validate: question non-empty, trimmed, under `MAX_MESSAGE_LENGTH`; botId present (deeper botId validation already lives in `getBot`, don't duplicate it); if `history` is present, cap it to the last 6-10 entries before forwarding.
> 2. `getBot(botId)` → `streamBotAnswer({ botName, knowledge, question, history })` → stream tokens back as a streamed `Response` (pick either SSE `text/event-stream` or chunked `text/plain`, and tell me which so I'm consistent in Phase 5).
> 3. **CORS:** handle the `OPTIONS` preflight and set `Access-Control-Allow-Origin` (permissive `*` is fine for the demo; add a comment noting production would allowlist the client's domain per botId).
> 4. Errors: unknown botId → 404, empty/too-long question → 400, AI failure → 502/500 — all as clean JSON with a friendly message, never a raw stack trace or SDK error object in the response.
> 5. Give me a curl command that posts a question for `acme-coffee` and prints the streamed answer (using `-N` to disable buffering), and one that simulates a cross-origin `OPTIONS` preflight to confirm CORS headers.
>
> **CONSTRAINTS:** Reuse the Phase 2/3 lib functions as-is, don't reimplement their validation. Genuinely incremental streaming, not a buffered-then-sent-all-at-once response. Explain the CORS preflight flow in a comment so I understand it, not just working code.

---

## Key concepts introduced this phase

- **Preflight requests.** A browser doesn't send your actual POST first when the request is "non-simple" (JSON content-type, cross-origin) — it sends an `OPTIONS` request first to ask permission, and only sends the real request if the server's `OPTIONS` response grants it. This is invisible in same-origin testing (which is why it's easy to forget) and becomes very visible the moment the widget runs on an actual different domain in Phase 6/8.
- **Streaming Responses from a Route Handler.** Unlike a typical `res.json(...)`, this route returns a stream that gets written to incrementally — the connection stays open and the client (Phase 5's `ChatWindow`) reads chunks as they arrive.
- **Never leak internals in error responses.** The specific wording matters less than the habit: a public API endpoint should return a stable, friendly error shape, and keep the actual exception details in your server logs, not the HTTP response.

---

## Definition of done

- [ ] curl posting to `/api/chat` for `acme-coffee` streams a grounded answer incrementally (visible with `-N`)
- [ ] `OPTIONS` preflight returns the correct `Access-Control-Allow-*` headers
- [ ] An unknown `botId` returns a clean 404, not a crash
- [ ] An empty or 600-character question returns a clean 400
- [ ] Committed to git: `git commit -m "Phase 4: /api/chat route with CORS and streaming"`

Next: [07-phase-5-embed-chat-ui.md](07-phase-5-embed-chat-ui.md)
