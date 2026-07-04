# Phase 6 — The Loader Script (`widget.js`) — Bubble + Iframe Injection

**Goal:** the single file clients paste onto their site. It reads `data-bot-id`, injects a floating bubble button, and on click injects/opens the iframe pointing at `/embed`. This is the product's signature feature — the whole "one line of code" pitch lives in this file.

Prerequisite: [Phase 5](07-phase-5-embed-chat-ui.md) complete (`/embed?botId=...` works correctly when visited directly).

---

## What you're building and why

Everything before this phase could, in principle, be *any* web app's backend + frontend. This phase is what turns it into an **embeddable widget product** specifically. Treat it with the weight the plan gives it: this is not "one more file," it's the feature the entire pitch depends on.

The core design problem: `widget.js` will run inside `<script>` tags on websites you don't control, built with tools you don't control (WordPress themes with their own jQuery, Shopify's Liquid-rendered pages, a marketing agency's hand-rolled HTML), sitting alongside other scripts you don't control. It has to:
1. Never crash the host page, even if something about its environment is unexpected.
2. Never leak its own styles onto the host page, or pick up the host page's styles onto itself.
3. Know where to find your app (`/embed`, `/api/chat`) without you hardcoding a URL into a file that might get copied, cached, or served from a different domain than you expect (a client on a custom CDN, a staging vs. production URL, etc).

---

## Step-by-step

### 1. Read your own `<script>` tag's attributes

Inside `widget.js`, `document.currentScript` refers to the `<script>` tag currently being executed — i.e., the exact tag the client pasted. From it:
- `document.currentScript.dataset.botId` → the `data-bot-id="acme-coffee"` value.
- `document.currentScript.src` → the full URL the client used to load this script, e.g. `https://yourapp.vercel.app/widget.js`.

### 2. Derive your app's origin dynamically — never hardcode it

From `document.currentScript.src`, parse out just the origin (`https://yourapp.vercel.app`) using `new URL(script.src).origin`. Every URL the widget constructs from here on (`.../embed?botId=...`) is built from *that* derived origin, not a string literal baked into the file.

Why this matters concretely: it means the exact same `widget.js` file works correctly whether it's served from `yourapp.vercel.app`, a custom domain you later put in front of it, or a local dev server during testing — because it always asks "where did I, myself, just get loaded from?" rather than assuming an answer. This is also what makes the file safe to hand to a client without editing it per-client — only the `data-bot-id` attribute changes per client, never the script's contents.

### 3. Inject the bubble button

- Create a container element, position it `fixed`, bottom-right, with a **very high `z-index`** (something like `2147483647`, the practical max, since you have no idea what z-index stacking contexts already exist on the host page).
- Style it with **inline styles only** (`element.style.xyz = ...`), not a linked stylesheet or injected `<style>` block with class selectors — this avoids any chance of a class-name collision with the host page's own CSS, since inline styles always win in specificity and never leak outward.
- Keep the bubble itself simple: a circular button, an icon (chat bubble glyph), maybe the bot's `accentColor` if you fetch `bot-meta` at this stage too, or just a sensible default color to keep the loader script simple and fast.

### 4. On click, create the iframe

- `iframe.src = \`${origin}/embed?botId=${botId}\``.
- Size it ~380×560 on desktop widths, full-screen (100vw/100vh) below a mobile breakpoint — check `window.innerWidth` at open time.
- Animate the open/close (a simple CSS transition on `opacity`/`transform` is enough) — respect `prefers-reduced-motion` here too, same as Phase 5.
- Clicking the bubble again (or a close button rendered by `/embed` itself, communicated back via `postMessage` if you want the iframe to be able to close itself) toggles it shut. Keep this simple for the demo: toggling the bubble is enough; a close button inside the iframe is a nice-to-have, not required.

### 5. Make it resilient

- Wrap the whole script in a check that it hasn't already run twice (in case a client accidentally pastes the tag more than once) — bail out early if a container with your widget's marker ID already exists.
- Wrap the body in a `try/catch` at the top level, or at least around DOM injection — a thrown error inside `widget.js` should never surface as a broken host page; log to `console.error` and stop, rather than letting an exception propagate.
- Don't assume `document.currentScript` is always available in every legacy loading pattern (it's reliably available for a normal synchronous `<script src="...">` tag, which is what you're asking clients to use — but note this assumption in a comment so it's not a silent landmine if someone later tries `async`/`defer` loading in an unusual way).

### 6. Wire it into the fake Acme page

Update `app/page.tsx` to include the real tag:
```html
<script src="/widget.js" data-bot-id="acme-coffee"></script>
```
This is the first point where you see your own product working exactly as a client would experience it.

---

## The prompt to paste to your AI coding assistant

> **CONTEXT RECAP:** Embeddable AI chatbot widget, Next.js 14 + TS. The chat UI at `/embed?botId=...` works and streams answers (Phase 5). Phase 6 of 8: the loader script `public/widget.js` that clients add to their site with `<script src=".../widget.js" data-bot-id="acme-coffee"></script>`. This injects a floating bubble and an iframe. This is the product's signature feature — treat it as the core deliverable, not a detail.
>
> **BUILD THIS PHASE:**
> 1. `public/widget.js` (plain vanilla JS, no framework, no build step — it must run standalone on arbitrary sites):
>    - Read `data-bot-id` from `document.currentScript.dataset.botId`.
>    - Derive the app's origin dynamically from `document.currentScript.src` via `new URL(...).origin` — no hardcoded domain anywhere in the file.
>    - Inject a small fixed-position container, bottom-right, with a floating bubble button, styled entirely with inline styles (no linked stylesheet, no class-based CSS) and a very high z-index (e.g. 2147483647).
>    - On click: create/open an `<iframe>` pointing to `${origin}/embed?botId=${botId}`, sized ~380×560 on desktop, full-screen on mobile widths, with a smooth open/close transition that respects `prefers-reduced-motion`. Clicking again minimizes it.
>    - Guard against double-injection if the script tag somehow appears twice on a page.
>    - Wrap DOM injection in error handling so a thrown error inside this script logs to console but never breaks the host page.
> 2. Update `app/page.tsx` to include the real `<script src="/widget.js" data-bot-id="acme-coffee"></script>` so the widget actually appears on the fake Acme page.
> 3. Explain, in plain language I can put in client docs later, how a business owner adds this one tag in WordPress (a theme's footer/header include or a plugin like Insert Headers and Footers), Shopify (theme.liquid or a custom app embed block), and plain HTML (just before `</body>`).
>
> **CONSTRAINTS:** `widget.js` must be vanilla JS, self-contained, and resilient — it must not crash or break the host page under any failure. No dependencies, no build step for this file specifically. Explain the origin-detection logic and the injection/z-index approach in comments so I genuinely understand them, not just working code.

---

## Key concepts introduced this phase

- **`document.currentScript` and dynamic origin detection.** This is the mechanism that makes the widget genuinely portable — the same static file works from any domain it's served from, because it introspects its own `<script src>` at runtime instead of trusting a baked-in constant. This is worth being able to explain fluently; it's the kind of detail that signals real embeddable-widget experience versus a toy demo.
- **Inline styles + extreme z-index as an isolation strategy for the injected bubble specifically.** Note this is *only* for the small bubble button that lives directly in the host page's DOM — the actual chat UI is isolated by the iframe itself (see [01-architecture-overview.md](01-architecture-overview.md)). The bubble is the one piece of your UI that isn't inside the iframe, so it needs its own, lighter-weight isolation discipline.
- **Defensive scripting for third-party embed contexts.** "Never crash the host page" is a different bar than normal app code — a bug in your own app breaks your own page; a bug in an embed script breaks someone else's business's website, which is the fastest way to lose a client's trust.

---

## Definition of done

- [ ] On your Acme host page, a real bubble appears in the bottom-right corner
- [ ] Clicking it opens the iframe chat, and it answers a real question correctly
- [ ] Clicking again closes/minimizes it
- [ ] The widget's bubble styles don't visibly clash with or get overridden by the host page's CSS, and vice versa
- [ ] `widget.js` contains no hardcoded domain anywhere — grep the file for `http` to confirm
- [ ] Pasting a second copy of the script tag doesn't create two bubbles
- [ ] Committed to git: `git commit -m "Phase 6: widget.js loader — bubble + iframe injection"`

Next: [09-phase-7-multibot-hardening.md](09-phase-7-multibot-hardening.md)
