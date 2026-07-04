# Phase 8 — Polish, README/Docs, Deploy to Vercel

**Goal:** deploy live; produce the copy-paste embed snippet + client instructions; finalize docs; make it screenshot-ready.

Prerequisite: [Phase 7](09-phase-7-multibot-hardening.md) complete (multi-bot proof + hardening all verified locally).

## Status in this repo

Steps 1-3 below (polish pass, "Powered by" footer, finalized `README.md`) are **already done**
and committed. What's left, and what this doc walks you through end to end, is **step 4
onward: the actual deploy and the cross-origin test** — you're doing this part yourself, so
everything below is written as a self-contained runbook, no AI assistant required.

---

## What you're building and why

Everything up to this phase has been proven locally. This phase proves the one claim that actually matters for the product: **it works when embedded on a genuinely different domain**, not just on your own `localhost`. That distinction is the real test of "embeddable" — a huge fraction of demo projects quietly only ever get tested same-origin, and that's exactly the gap that would surface as a live bug in front of a real client. Don't skip the cross-origin test at the end of this phase.

---

## Step-by-step

### 1. Final polish pass ✅ done

Every failure mode (unknown bot, rate limit hit, network error, model error) renders as a clean, in-character message inside the widget — verified in Phase 4/7 testing. The bubble never breaks the host page even when `/api/chat` fails.

### 2. "Powered by" footer ✅ done

`components/ChatWindow.tsx` shows a small "Powered by [Your Name]" line, gated behind `SHOW_POWERED_BY` in `lib/config.ts`. **Before you screenshot/deploy for a portfolio piece, edit that line in `ChatWindow.tsx` to your actual name or brand** — it's currently a literal placeholder.

### 3. Finalized `README.md` ✅ done

Local setup, env vars, embed snippet, and client-onboarding instructions are all in the repo's top-level `README.md`.

### 4. Deploy to Vercel — do this yourself

You have two ways to do this. **Option A doesn't need GitHub at all** — use it if you want to deploy right now. Option B is the more common "connected repo" workflow if you push to GitHub later.

#### Option A — Vercel CLI, no GitHub needed

```bash
# 1. Install the Vercel CLI (one-time, global)
npm install -g vercel

# 2. From the project root, log in — this opens your browser to authenticate
vercel login

# 3. Link + deploy a preview first (asks a few setup questions the first time:
#    project name, which directory is the root — accept the defaults, this is
#    a standard Next.js app)
vercel

# 4. Set your Groq key as a Vercel environment variable (do this once)
vercel env add GROQ_API_KEY production
#    — paste your key when prompted. Repeat with "preview" and "development"
#    as the environment name if you want it available there too.

# 5. Deploy to production
vercel --prod
```

Vercel prints your live URL (`https://<something>.vercel.app`) at the end of the `vercel --prod` step — that's your deployed app.

#### Option B — push to GitHub, import via Vercel's dashboard

```bash
# create an empty repo on github.com first, then:
git remote add origin <your-github-repo-url>
git push -u origin main
```
Then in the Vercel dashboard: **Add New → Project → Import** your GitHub repo → in the
project's **Settings → Environment Variables**, add `GROQ_API_KEY` with your real key → Deploy.

#### Either way, confirm on the live URL:

- [ ] `https://<your-app>.vercel.app/` — Acme page loads, the bubble appears and answers questions
- [ ] `https://<your-app>.vercel.app/embed?botId=acme-coffee` — loads directly, coffee-brown theme
- [ ] `https://<your-app>.vercel.app/embed?botId=bright-dental` — loads directly, teal theme, different facts
- [ ] `https://<your-app>.vercel.app/widget.js` — loads with `Content-Type: application/javascript`

### 5. The real cross-origin test — the actual acceptance test for this whole project

Create a **separate, minimal `.html` file** — not part of this repo, just a scratch file anywhere on your machine (e.g. `~/Desktop/widget-test.html`) — with nothing but:

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

Replace `your-app.vercel.app` with your real deployed domain from step 4. Open this file
directly in a browser (double-click it, or `open widget-test.html` on macOS — a `file://` URL
counts as a different origin than your Vercel app, which is exactly the point). Open the
browser's devtools console before you click anything. Confirm:

- [ ] The bubble appears on this totally unrelated page
- [ ] Clicking it opens the iframe and it answers a real question correctly
- [ ] **Zero CORS errors** in the devtools console
- [ ] The rest of this scratch page (the `<h1>`) looks completely untouched by the widget

If this fails, see [11-troubleshooting-recovery.md](11-troubleshooting-recovery.md)'s CORS
section — a widget that only works on your own domain isn't the product this was built to be.

### 6. Client-facing embed instructions ✅ already in `README.md`

Plain HTML, WordPress, and Shopify instructions are already written in the top-level
`README.md`'s "Adding it to a real site" section — hand that section to a client as-is.

---

## After deployment

1. **Screenshot** the widget open on the live Acme page — this is your gig **Image 1 (hero/thumbnail)**.
2. **Record a 20-30s screen capture**: the bubble on the Acme site answering 2 questions, then
   change the embed snippet's `data-bot-id` from `acme-coffee` to `bright-dental` and reload —
   proves rebranding in one clip.
3. Add the live URL + repo link to your portfolio/gig listing.
4. Update the "Status" section at the top of `README.md` from "not yet deployed" to the live URL.

---

## Definition of done

- [ ] Live at a `*.vercel.app` URL (or custom domain); Acme page + widget work live
- [ ] The `widget.js` snippet works when pasted into a *separate* HTML file on a different origin — the real test of embeddability
- [ ] `GROQ_API_KEY` set in Vercel's environment variables, not committed anywhere in git
- [ ] README's Status section updated with the live URL

This is the last phase. Go back to [00-model-landscape.md](00-model-landscape.md) if you want to revisit the free-vs-paid model discussion once you have a real client with real traffic.
