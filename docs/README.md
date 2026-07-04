# Demo 2 — Embeddable Website AI Chatbot Widget: Build Docs

This folder is the detailed, explainable version of the phased build plan for the embeddable chatbot widget. It expands each phase from a short checklist into: what you're building and *why*, exact step-by-step instructions, the paste-ready prompt for your AI coding assistant, the key concepts each phase teaches, and a definition of done.

**One change from the original plan:** the model provider is **Groq's free API** (`llama-3.1-8b-instant`), not paid OpenAI. See [00-model-landscape.md](00-model-landscape.md) for the full reasoning and for a broader "what's out there" survey of free and paid LLM options as of mid-2026, for your own knowledge. Everything else in the original plan's structure and phasing is preserved.

## How to use this

- Go phase by phase, in order — don't paste a whole doc's prompt at once.
- Keep the same AI-assistant chat open across phases when you can. If you must start a fresh chat, each phase doc's prompt includes a **context recap** so it still works standalone.
- Run and verify the "Definition of done" checklist before moving to the next phase.
- `git commit` after every passing phase (each doc gives you the exact commit message to use).
- No dollar spend limit to set before Phase 3 — Groq's free tier isn't billed, only rate-limited. See [02-phase-0-prerequisites.md](02-phase-0-prerequisites.md) for what to set up instead.

## Reading order

| # | Doc | What it covers |
|---|---|---|
| — | [00-model-landscape.md](00-model-landscape.md) | Free vs. paid LLM options in the market today, and why Groq was picked — read this first, it's general knowledge as much as a build decision |
| — | [01-architecture-overview.md](01-architecture-overview.md) | The full architecture, why an iframe, why each file exists — read this once before Phase 1 |
| 0 | [02-phase-0-prerequisites.md](02-phase-0-prerequisites.md) | Node, Groq API key, GitHub repo, your demo business's facts |
| 1 | [03-phase-1-scaffold-and-host-page.md](03-phase-1-scaffold-and-host-page.md) | Scaffold Next.js + the fake "Acme Coffee" landing page |
| 2 | [04-phase-2-bot-config-loader.md](04-phase-2-bot-config-loader.md) | `lib/bots.ts` — load & validate a bot config by id |
| 3 | [05-phase-3-ai-layer.md](05-phase-3-ai-layer.md) | `lib/ai.ts` — grounded, streamed answers via Groq |
| 4 | [06-phase-4-chat-api-cors.md](06-phase-4-chat-api-cors.md) | `/api/chat` route, streaming, CORS |
| 5 | [07-phase-5-embed-chat-ui.md](07-phase-5-embed-chat-ui.md) | The `/embed` chat UI that lives inside the iframe |
| 6 | [08-phase-6-widget-loader-script.md](08-phase-6-widget-loader-script.md) | `widget.js` — the signature "one script tag" feature |
| 7 | [09-phase-7-multibot-hardening.md](09-phase-7-multibot-hardening.md) | A second bot (rebranding proof), rate limiting, jailbreak guarding |
| 8 | [10-phase-8-deploy-and-launch.md](10-phase-8-deploy-and-launch.md) | Deploy to Vercel, real cross-origin test, client instructions |
| — | [11-troubleshooting-recovery.md](11-troubleshooting-recovery.md) | What to paste when something breaks, and how to self-diagnose first |

## The one thing to hold onto across all 8 phases

The real product isn't the chat itself — plenty of things can answer questions from a knowledge blob. The product is that it arrives on a stranger's website via **one script tag**, never breaks that page, and never leaks the client's business facts to anyone it shouldn't. Every phase either builds toward that or hardens it. Phase 8's cross-origin test — the widget working when pasted into a *completely different* site than the one you built it on — is the moment that claim stops being a plan and becomes a fact you can screenshot.
