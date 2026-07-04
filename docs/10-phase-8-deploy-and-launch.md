# Phase 8 — Polish, README/Docs, Deploy to Vercel

**Goal:** deploy live; produce the copy-paste embed snippet + client instructions; finalize docs; make it screenshot-ready.

Prerequisite: [Phase 7](09-phase-7-multibot-hardening.md) complete (multi-bot proof + hardening all verified locally).

---

## What you're building and why

Everything up to this phase has been proven locally. This phase proves the one claim that actually matters for the product: **it works when embedded on a genuinely different domain**, not just on your own `localhost` or your own deployed Acme page. That distinction is the real test of "embeddable" — a huge fraction of demo projects quietly only ever get tested same-origin, and that's exactly the gap that would surface as a live bug in front of a real client. Don't skip the cross-origin test at the end of this phase.

---

## Step-by-step

### 1. Final polish pass

- Walk through every failure mode from earlier phases (unknown bot, rate limit hit, network error, model error) and confirm each renders as a clean, in-character message inside the widget — never a raw error, a broken layout, or a frozen "thinking" state with no timeout/fallback.
- Confirm the bubble never breaks a host page even in a bad case (e.g. temporarily block `/api/chat` in devtools and confirm the widget still opens and shows a friendly error instead of hanging silently or throwing in the console).

### 2. Add a "Powered by" footer line

A small, unobtrusive line in the `ChatWindow` footer (e.g. "Powered by [Your Name]"), gated behind a config flag (e.g. `SHOW_POWERED_BY` in `lib/config.ts` or per-bot in the JSON config) so it can be turned off for a client who pays to remove it — a genuinely common real-world SaaS pattern worth having in place even for a portfolio demo, since it signals you've thought about the business model, not just the code.

### 3. Finalize `README.md`

Sections to fill in for real now (some were placeholders from Phase 1):
- What the project does, one paragraph, written for someone evaluating you as a freelancer — not just a technical audience.
- Screenshot placeholder(s) — you'll fill these in after deploying (see "After all 8 phases" below).
- Local setup: clone, `npm install`, copy `.env.example` to `.env.local`, add your own `GROQ_API_KEY`, `npm run dev`.
- Environment variables table: `GROQ_API_KEY` (required).
- **The exact client embed snippet**, verbatim, e.g.:
  ```html
  <script src="https://your-app.vercel.app/widget.js" data-bot-id="acme-coffee"></script>
  ```

### 4. Deploy to Vercel

```bash
# push to GitHub first if you haven't already
git push -u origin main
```
Then:
1. Import the repo at vercel.com (or `vercel` CLI → `vercel --prod` once linked).
2. In the Vercel project's environment variables, set `GROQ_API_KEY` to your real key. **Never commit this** — `.env.local` should already be gitignored from Phase 1; double check with `git check-ignore .env.local` before this step.
3. Deploy. Confirm the live URL loads the Acme page, `/embed?botId=acme-coffee` works directly, and `/widget.js` is served from `https://<your-app>.vercel.app/widget.js`.

### 5. The real cross-origin test

This is the step that actually validates the whole product. Create a **separate, minimal `.html` file** — not part of this repo, just a scratch file on your machine — with nothing but:

```html
<!DOCTYPE html>
<html>
<head><title>Totally unrelated test page</title></head>
<body>
  <h1>This page has nothing to do with Acme Coffee.</h1>
  <script src="https://your-app.vercel.app/widget.js" data-bot-id="acme-coffee"></script>
</body>
</html>
```

Open this file directly in a browser (`file://...` or a trivial local static server on a different port — either counts as a different origin than your Vercel app). Confirm:
- The bubble appears.
- Clicking it opens the iframe and it answers questions correctly.
- No CORS errors in the browser console.
- The host page (this scratch file) is completely unaffected by the widget's presence otherwise.

If this step fails, work through [11-troubleshooting-recovery.md](11-troubleshooting-recovery.md)'s CORS section before considering the phase done — a widget that only works on your own domain isn't actually the product you set out to build.

### 6. Write client-facing embed instructions

Plain-language steps (this becomes a `docs/` deliverable for real client handoff later, per the gig-guide reference in the original plan):
- **Plain HTML**: paste the script tag just before `</body>`.
- **WordPress**: use the theme's footer include, or a "Insert Headers and Footers"-style plugin, pasting the tag into the footer scripts box.
- **Shopify**: add via `theme.liquid`'s footer section, or as a custom "app embed" block in the theme customizer if the client's theme supports app blocks.

### 7. Live-URL sanity checklist

- [ ] `https://<your-app>.vercel.app/` — Acme page loads, widget appears and works
- [ ] `https://<your-app>.vercel.app/embed?botId=acme-coffee` — loads directly, themed correctly
- [ ] `https://<your-app>.vercel.app/embed?botId=bright-dental` — loads directly, themed differently
- [ ] `https://<your-app>.vercel.app/widget.js` — served correctly, no build errors
- [ ] The scratch cross-origin test page from step 5 works with zero CORS errors

---

## The prompt to paste to your AI coding assistant

> **CONTEXT RECAP:** Embeddable AI chatbot widget, Next.js 14 + TS + Tailwind, fully working locally: script → bubble → iframe → streamed grounded chat, multi-bot via JSON, rate-limited and guarded, using Groq's free API. Phase 8 of 8: deploy to Vercel and finalize.
>
> **BUILD THIS PHASE:**
> 1. Final error/polish pass: walk every failure mode (unknown bot, rate limit, network error, model error) and confirm each shows a clean, in-character message inside the widget; confirm the bubble never breaks the host page even when `/api/chat` is unreachable.
> 2. Add a small "Powered by [my name]" line in the widget footer, gated behind a config flag so it can be removed per client.
> 3. Finalize `README.md`: what it does, screenshot placeholders, local setup, env vars (`GROQ_API_KEY`), and the exact client embed snippet.
> 4. Walk me through deployment: push to GitHub → import to Vercel → set `GROQ_API_KEY` in Vercel's environment variables → deploy. Then confirm `widget.js`, `/embed`, and `/api/chat` all work from the live domain.
> 5. Help me verify CORS actually works by testing the live `widget.js` embedded in a separate plain `.html` file on a completely different origin (not this repo, not the Acme page) — walk me through what to check in the browser console if it fails.
> 6. Write the client-facing embed instructions for WordPress, Shopify, and plain HTML in plain, non-technical language.
>
> **CONSTRAINTS:** Keep it demo-simple — no over-engineering the deploy pipeline. Secrets never committed (double-check `.env.local` is gitignored before pushing). The cross-origin test in step 5 is the real acceptance criterion for this whole project, not an optional nice-to-have — don't consider this phase done until it passes.

---

## Key concepts introduced this phase

- **Same-origin testing is a false positive for an embeddable product.** Your own Acme page and your Vercel app share an origin with `/embed` and `/api/chat` by construction — so testing only there can hide real cross-origin bugs (a missing CORS header, an iframe-blocking header, a same-site cookie assumption) that only show up once a *different* domain tries to use the widget. The scratch-file test in step 5 is what closes that gap.
- **Environment variables in deployment vs. local dev.** `.env.local` never leaves your machine; Vercel's project environment variables are the production equivalent — the same variable name (`GROQ_API_KEY`), set in two different places, never committed to git in either case.
- **The "Powered by" line as a product decision, not just a UI detail.** A config-gated attribution line is how real embeddable-widget businesses (Calendly, Crisp, Intercom's smaller competitors, etc.) monetize a free/cheap tier — worth having even in a portfolio piece because it demonstrates you're thinking about the client-facing business model, not just the code.

---

## After all 8 phases

1. Screenshot the widget open on the live Acme page — this is your gig **Image 1 (hero/thumbnail)**.
2. Record a 20-30s screen capture: the bubble on the Acme site answering 2 questions, then switch `data-bot-id` to show the dental bot responding differently — this proves rebranding in one clip.
3. Add the live URL + repo link to your portfolio/gig listing.
4. Consider writing a `docs/03-rebranding-per-client.md`-style note (separate from this planning `docs/` folder, more like an internal runbook) describing exactly how you'd onboard a real paying client in an afternoon — this becomes your actual service-delivery process once someone hires you.

---

## Definition of done

- [ ] Live at a `*.vercel.app` URL (or custom domain); Acme page + widget work live
- [ ] The `widget.js` snippet works when pasted into a *separate* HTML file on a different origin — the real test of embeddability
- [ ] README + client embed instructions complete
- [ ] Pushed to GitHub (clean repo, no committed secrets)
- [ ] Committed to git: `git commit -m "Phase 8: polish, docs, and deploy"`

This is the last phase. Go back to [00-model-landscape.md](00-model-landscape.md) if you want to revisit the free-vs-paid model discussion once you have a real client with real traffic.
