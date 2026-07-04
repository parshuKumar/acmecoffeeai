# Phase 0 — Prerequisites

**You do this phase yourself — no AI coding assistant involved yet.** Everything here is account setup and decisions, not code.

Read [01-architecture-overview.md](01-architecture-overview.md) first if you haven't — it explains why every later phase is structured the way it is.

---

## 1. Install Node 20+

Check what you have:

```bash
node -v
```

If it's below `v20`, install via [nvm](https://github.com/nvm-sh/nvm) (recommended, lets you switch Node versions per project):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
nvm install 20
nvm use 20
node -v   # confirm v20.x or higher
```

## 2. Get a free Groq API key

We're using Groq instead of OpenAI as the model provider — see [00-model-landscape.md](00-model-landscape.md) for the full reasoning (genuinely free, no credit card, OpenAI-SDK compatible, fast).

1. Go to Groq's console and sign up (no credit card required for the free tier).
2. Create an API key.
3. Save it somewhere safe temporarily — you'll paste it into `.env.local` in Phase 1, and it should **never** be committed to git.
4. There's no billing dashboard to set a hard spend limit on, because the free tier is rate-limited, not billed — you cannot accidentally rack up a bill on it. That's the whole point of using it for this build. (If you later swap to a paid provider like OpenAI or Claude for a real client, set a hard spend cap on that provider's dashboard before running any code against it — that habit still matters, it just isn't a Groq-specific step.)

Sanity-check the key works before you write any app code:

```bash
curl https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer YOUR_GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.1-8b-instant",
    "messages": [{"role": "user", "content": "Say hello in five words."}]
  }'
```

You should get back a JSON response with a `choices[0].message.content`. If you get a 401, the key is wrong; if you get a 404 on the model name, check Groq's current model list (model availability/naming shifts occasionally — verify the exact string on Groq's docs at build time).

## 3. Create the GitHub repo

```bash
gh repo create ai-chatbot-widget --private --clone
cd ai-chatbot-widget
```

(Use `--public` instead if you want the repo public from day one — either is fine for a portfolio project; you can flip visibility later in GitHub settings.)

## 4. Decide your demo business and write ~10 real facts

This matters more than it sounds like. The plan calls for "Acme Coffee" as the demo business, and the whole point of Phase 1's landing page and this bot's believability is that the facts feel like a real, specific place — not generic placeholder text.

Write down 8-10 concrete facts now, in a plain list, covering things a real visitor would actually ask a coffee shop's chat widget:

- Hours (including any different weekend hours)
- Full address / neighborhood
- Phone number (can be fake but formatted realistically)
- 3-5 signature menu items with actual prices
- Whether they offer things like: wifi, dog-friendly seating, delivery, catering, gift cards
- Parking situation
- One or two "personality" facts (e.g. "we roast our own beans in-house every Tuesday") — these make demo answers feel specific rather than templated
- A policy fact or two (e.g. cancellation policy for catering orders, or "cash only" if relevant) — good for testing that the bot declines gracefully when asked something adjacent but not covered

Keep this list somewhere you can paste from — you'll hand it to the AI assistant verbatim in Phase 1 when it builds `bots/acme-coffee.json`.

---

## Definition of done

- [ ] `node -v` reports v20 or higher
- [ ] Groq API key obtained, and the `curl` sanity check above returns a real response
- [ ] Empty GitHub repo `ai-chatbot-widget` created and cloned locally
- [ ] 8-10 concrete Acme Coffee facts written down, ready to paste into Phase 1

Once all four are checked, move to [03-phase-1-scaffold-and-host-page.md](03-phase-1-scaffold-and-host-page.md).
