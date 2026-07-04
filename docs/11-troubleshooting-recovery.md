# Troubleshooting & Recovery Prompts

When something breaks mid-phase, the fastest path back on track is usually a small, targeted prompt to your AI coding assistant — not a full rewrite. The pattern that works: **paste the exact error, name the exact file, and explicitly forbid a broad rewrite.** This document collects the recovery prompts from the original plan, expanded with the reasoning behind each one, plus how to self-diagnose before you even paste anything.

---

## General principle: diagnose before you prompt

Before reaching for the AI assistant, spend thirty seconds narrowing the failure yourself — it makes the eventual prompt far more precise, and sometimes you'll spot the fix without needing a prompt at all:
1. **Which phase's boundary does this cross?** (See the request lifecycle in [01-architecture-overview.md](01-architecture-overview.md).) A blank chat window is a Phase 5 or Phase 4 problem; a missing bubble is a Phase 6 problem; a wrong or fabricated answer is a Phase 3 problem.
2. **What does the browser devtools console/network tab actually say?** A red CORS error, a 404, a 500, a JS exception — these point at very different fixes and are worth including verbatim in your prompt.
3. **Does it fail the same way with a fresh `npm run dev` restart?** Rules out stale dev-server state before you assume it's a real code bug.

---

## Recovery prompt: broken code, generic

> "This errors with [paste the exact error message + file path + line if shown]. Don't rewrite everything — diagnose this specific error, give me a one-line explanation of the root cause, then the minimal fix."

**Why the "don't rewrite everything" line matters:** without it, an AI assistant asked to "fix this" will sometimes regenerate a whole file from scratch, which can silently undo working code from an earlier session (especially likely if you're in a fresh chat that only has the phase's recap, not the full history of everything you've since tweaked by hand). Naming the specific file and demanding a minimal fix keeps the blast radius small.

---

## Recovery prompt: bubble not appearing / iframe not opening (Phase 6)

> "The bubble doesn't show / the iframe doesn't open. Walk me through: how `widget.js` finds its own origin, how it injects the container, the z-index value, and where in that chain it's failing. Fix that step only."

**Self-diagnosis first:**
- Open devtools console on the host page — is `widget.js` even loading (Network tab, look for a 200 on `widget.js`)? A 404 here usually means the `src` path is wrong or the file isn't deployed/served.
- Is there a JS error thrown *before* the bubble-creation code runs? A single early exception (e.g. `document.currentScript` being `null` in an unusual loading context) can silently stop the whole script.
- Inspect the page's DOM — is the container element actually present but invisible (a z-index or `display` issue), or genuinely never created (a logic/exception issue upstream)? These have different fixes.

---

## Recovery prompt: CORS errors (Phase 4 / Phase 8)

> "The widget on a different domain gets a CORS error calling `/api/chat`. Show me the exact preflight request + response headers needed, and fix the route."

**Self-diagnosis first:**
- The browser console error itself usually names exactly what's missing (e.g. "No 'Access-Control-Allow-Origin' header is present"). Paste that exact line into your prompt — it's the single most useful piece of information you can provide.
- Check the Network tab for the `OPTIONS` preflight request specifically — did it even get sent, did it return the right headers, or did it fail before your route's `POST` logic ran at all?
- Remember this only reproduces on a genuinely cross-origin test (see [Phase 8, step 5](10-phase-8-deploy-and-launch.md)) — testing only on your own Acme page (same-origin) will never surface a real CORS bug, which is exactly why that step exists.

---

## Recovery prompt: styling leaks between widget and host page (Phase 6)

> "Confirm the widget is fully isolated via the iframe and nothing leaks either direction; if the injected bubble inherits host styles, scope it with inline styles."

**Self-diagnosis first:**
- Anything *inside* the iframe (the actual chat UI) should be structurally incapable of leaking either direction — if you're seeing a style problem there, double check the element in question is genuinely inside the iframe's document and not, say, a bubble-related element that accidentally lives in the host page's DOM instead.
- Anything in the *injected bubble* (outside the iframe, directly in the host page's DOM) is the one place this can genuinely happen — check whether its styles were set via inline `style.xyz = ...` (safe) or via a class name / injected stylesheet (fragile, can collide with or be overridden by the host page's own CSS rules).

---

## Recovery prompt: the bot answers wrong or makes something up (Phase 3 / Phase 7)

> "Ask [exact question] against bot [botId] and it answered [wrong/fabricated answer] instead of [correct behavior — either the right fact, or a polite decline]. Show me the exact system prompt and knowledge string being sent for this request, then tighten the grounding instruction without breaking answers that ARE in the knowledge."

**Self-diagnosis first:**
- Is the fact actually in that bot's `knowledge` string at all? A "wrong answer" complaint is sometimes actually a missing-fact problem, not a grounding-instruction problem — fix is different (add the fact to the JSON, not touch the system prompt).
- Is the question adjacent-but-not-quite-covered (the classic case this whole grounding instruction exists for)? Confirm what you actually want: a polite decline, or an inference from adjacent facts (e.g. hours listed as "Mon-Fri 6:30am-6pm" answering "are you open at 5pm on a Wednesday?" — this requires the model to reason over the given facts, which is fine; it's inventing a fact *not* given at all that's the failure mode to guard against).

---

## Recovery prompt: rate limiting fires too eagerly, or not at all (Phase 7)

> "My rate limiter [is blocking normal use / isn't blocking a rapid-fire test]. Show me the current window/count logic and the exact `RATE_LIMIT_PER_MIN` value being used, then adjust just the threshold or window, not the whole mechanism."

**Self-diagnosis first:**
- Remember the Phase 7 caveat: in-memory rate limiting on Vercel doesn't share state across all invocations/regions reliably — if it seems to "reset" unexpectedly under real traffic, that's expected behavior for this simple approach, not a bug to chase indefinitely. It's fine for a demo; it's a known, documented limitation for anything beyond that.

---

## When a recovery prompt doesn't work after one or two tries

Stop and read the actual code yourself (or have a fresh chat re-read just the one file in question) rather than iterating blindly on prompts — an AI assistant re-guessing at the same problem repeatedly without new information tends to drift toward larger, riskier rewrites rather than converging on the real fix. Narrowing to "show me exactly what's happening at this one point" (a `console.log`, a specific header dump, a specific prompt string) usually breaks the loop faster than a fourth rephrased fix request.
