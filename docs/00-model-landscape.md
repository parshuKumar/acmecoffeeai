# The LLM Market in Mid-2026 — What's Free, What's Paid, and What We're Using

This document exists for your own knowledge, separate from the build itself. It answers: *what are my options for the "brain" behind this chatbot, and why did we pick the one we picked?*

It's split in two:
1. **Free options** — what we're actually using, and the runners-up.
2. **Paid options** — the market landscape, so you know what exists and when you'd reach for it (e.g. a client with real traffic who wants top-tier quality).

Prices and limits below were checked in **July 2026**. This market moves fast — free tiers get tightened, renamed, or replaced every few months (Gemini's free Pro access disappeared in April 2026, for example). Treat exact numbers as "roughly this, verify on the provider's page before you build."

---

## 1. Free options — the real candidates for this project

Since Phase 8 deploys this to Vercel and the whole point is that *strangers' websites* call your API, "free" here means a **hosted API with a genuinely free tier**, not just "open-weight model" (an open-weight model still needs a GPU somewhere to run — see the Ollama note below on why that's not a fit for a deployed multi-tenant widget).

| Provider | Free tier (as of Jul 2026) | Speed | Context | OpenAI-SDK compatible? | Notes |
|---|---|---|---|---|---|
| **Groq** ⭐ | No credit card. `llama-3.1-8b-instant`: ~14,400 requests/day, 500K tokens/day. `llama-3.3-70b-versatile`: ~1,000 requests/day, better quality. | Extremely fast (custom LPU chips — noticeably faster token-by-token than anything else on this list) | 128K | **Yes** — just point `baseURL` at `https://api.groq.com/openai/v1` | Best fit for a chat widget: speed *feels* better in a bubble UI, generous daily cap, zero setup friction |
| **Google Gemini** | `gemini-2.5-flash-lite`: ~15 RPM, 250K tokens/min, 1,000 requests/day. (Pro models became paid-only in April 2026 — Flash/Flash-Lite are the free tier now.) | Fast | 1M tokens | No — own SDK (`@google/genai`) | Best if you need huge context (whole PDFs, long transcripts) or multimodal input; overkill for a ~10-fact business FAQ bot |
| **Cerebras** | 1M tokens/day free, no credit card. Llama 4 Scout / Qwen3 32B. | Fastest raw throughput (2,600+ tok/sec) | 8K on free tier (temporary cap) | Yes (OpenAI-compatible) | Great daily *volume*, but the 8K context cap is tight once you add knowledge + system prompt + history |
| **OpenRouter (free pool)** | ~20 RPM / 200 requests/day pooled across ~20-29 free models (Llama 3.3 70B, DeepSeek R1 Distill, Qwen3, GPT-OSS 120B, etc.) | Varies by underlying model | Varies | Yes | One key, many models — good for *testing* which model answers your FAQ bot best before committing |
| **Mistral** | "Experiment" tier, free, ~1B tokens/month cap, rate-limited | Medium | 128K | No (own SDK, OpenAI-compatible mode available) | Explicitly labeled "for evaluation, not production" by Mistral themselves |
| **DeepSeek** | 5M free tokens on signup, expires in 30 days | Medium | 64K | Yes (OpenAI-compatible) | A trial credit, not a standing free tier — fine for testing, not for an ongoing demo |
| **Ollama (local)** | Unlimited, $0, runs on your own machine | Depends on your hardware | Depends on model | N/A (local server, OpenAI-compatible mode available) | **Not usable for this project's deployed version.** Vercel's serverless functions don't have a GPU/persistent process to run a local model. Ollama is great for offline experimentation on your laptop, not for `api.chat` running in the cloud answering real site visitors. |

### What we're actually using: **Groq, `llama-3.1-8b-instant`**

Reasons, specific to this project:
- **It's genuinely free with no credit card** and the daily cap (14,400 requests/day) is far beyond what a portfolio demo — or most single small-business clients — will ever hit.
- **It's OpenAI-SDK compatible.** Groq deliberately mirrors the OpenAI chat-completions API shape. That means `lib/ai.ts` ends up looking almost identical to a "real" OpenAI integration — same `openai` npm package, same streaming pattern — you just point `baseURL` at Groq and use a Groq model name. This matters for your portfolio story: you can tell a client "yes, this can run on GPT-4 or Claude instead, it's a one-line swap," and it's true, because you built to that interface from day one.
- **Speed matters for the product feel.** A chat bubble that visibly "types" fast reads as more polished than one with a 2-3 second pause before the first token. Groq's LPU hardware is the fastest inference on this list by a wide margin.
- **8B is enough for this job.** The bot only ever answers from a small, hand-written knowledge blob (~10 facts) — this is retrieval-constrained Q&A, not open-ended reasoning. An 8B instruction-tuned model handles "stay in this lane, quote these facts, decline politely otherwise" comfortably. Save the 70B tier (`llama-3.3-70b-versatile`, same free Groq account, just a different model string) for if answers feel too terse or literal.

### The fallback plan (worth knowing, don't build it yet)

Because all model calls live in one file (`lib/ai.ts`), if Groq's free tier ever gets tightened (it happens — see the Gemini Pro example above) or you hit the daily cap during a demo, the swap path is:
1. Same code shape, different `baseURL` + `model` + API key env var → Google Gemini free tier, **or**
2. Route through OpenRouter's free pool (one more env var, same OpenAI SDK, `model: "openrouter/free"` lets it auto-pick an available free model).

This is exactly the kind of resilience the "Model-swap note" in the original plan was gesturing at — we're just aiming the swap point at a free provider first instead of OpenAI.

---

## 2. Paid options — the wider market (for your knowledge)

You don't need any of these for this build. But a freelancer should know the landscape, because clients will ask "can we use ChatGPT?" or "is this the same as Claude?" and you should be able to answer confidently.

| Provider / Model | Rough price (per 1M tokens, in/out) | Where it's strong | Where it fits |
|---|---|---|---|
| **OpenAI GPT-5.5** (flagship) | ~$5 / $30 | Best general reasoning + broad tool ecosystem | High-end client work, complex multi-step agents |
| **OpenAI GPT-5.4** | ~$2.50 / $15 | Strong mid-tier | Good default for a paying client who wants quality margin over free tiers |
| **OpenAI GPT-5.4-mini / GPT-4o-mini** | ~$0.15-0.75 / $1.25-4.50 | Cheap, fast, "good enough" for grounded FAQ bots | This is what the *original* version of this plan used — still an excellent choice once you're billing a client and want a paid safety margin over free-tier rate limits |
| **OpenAI o3 / o4-mini** | ~$1.10-2 / — | Reasoning-heavy tasks (multi-step logic, math, planning) | Overkill for a business FAQ bot; relevant if you later add e.g. appointment-scheduling logic |
| **Anthropic Claude (Haiku 4.5 / Sonnet 5 / Opus 4.8)** | Haiku cheapest, Opus most capable | Strong instruction-following, careful/safe tone, long-context reliability | Clients who want a more "careful," less hallucination-prone voice for customer-facing text — Haiku 4.5 is very close to gpt-4o-mini's price point |
| **Google Gemini 2.5/3.1 Pro** | Paid since April 2026 | Huge context (1M tokens), multimodal | Businesses whose "knowledge" is large (long manuals, big PDFs) rather than ~10 facts |
| **Mistral Large / Codestral** | ~$2 / — (Large); cheap (Codestral) | Open-weight lineage, EU-hosted (data residency angle for EU clients) | A client who explicitly cares about non-US hosting |

### The one-sentence pitch you can give clients
"The chatbot's 'brain' is swappable — we can run it on a free fast model to keep your costs at zero, or upgrade to GPT-5 or Claude for a few cents a month if you want maximum polish. Either way, it only ever answers from the business info you approve, never makes things up."

---

## Why this matters architecturally

The entire reason `lib/ai.ts` is the *only* file allowed to talk to a model provider (see [01-architecture-overview.md](01-architecture-overview.md)) is so that this table is a business decision, not a re-engineering project. Swapping rows in this table should never require touching `lib/bots.ts`, the API route, or any UI component.
