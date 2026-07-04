# AI Chatbot Widget

An embeddable AI chat widget: paste one `<script>` tag into any website and a chat bubble
appears that answers questions about that business — grounded only in facts you provide,
streamed token-by-token, fully isolated from the host page via an iframe.

This repo was built in 8 phases. See [`docs/`](docs/README.md) for the full plan, the
architecture reasoning (why an iframe, why Groq, why per-bot JSON files), and a
phase-by-phase build guide.

**Screenshot:** _add one here of the bubble open on the Acme Coffee demo page — this is your
gig thumbnail once deployed._

## Status

All 8 phases complete locally: scaffold → bot config loader → grounded streaming AI layer
(Groq, free tier) → CORS-enabled chat API → embed chat UI → `widget.js` loader → multi-bot
proof + rate limiting/jailbreak hardening → this polish pass. Not yet deployed to a public URL.

## Local setup

```bash
npm install
cp .env.example .env.local   # then paste your Groq API key into .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the fake "Acme Coffee" demo site, with
the real chat widget bubble live in the bottom-right corner. Try `/embed?botId=bright-dental`
to see the second demo bot themed differently.

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `GROQ_API_KEY` | Yes | Free API key from [console.groq.com/keys](https://console.groq.com/keys) — no credit card needed. See `docs/00-model-landscape.md` for why Groq was chosen over a paid provider. |

## Embed snippet

This is exactly what a client pastes onto their own site — nothing else required:

```html
<script src="https://your-app.vercel.app/widget.js" data-bot-id="acme-coffee"></script>
```

Swap `data-bot-id` for any file name in `bots/` (e.g. `bright-dental`) to point the same
script at a different business — no code changes needed, just a different JSON file in `bots/`.

### Adding it to a real site

- **Plain HTML** — paste the tag just before `</body>`.
- **WordPress** — add it via your theme's footer include, or a plugin like "Insert Headers
  and Footers," pasting the tag into the footer scripts box.
- **Shopify** — add it to `theme.liquid`'s footer section, or as a custom "app embed" block
  in the theme customizer if the theme supports app blocks.

## Onboarding a new client

1. Write their business facts into `bots/<their-id>.json` (see `bots/_schema.md` for the shape).
2. Give them the embed snippet with `data-bot-id="<their-id>"`.
3. That's it — no other code changes.

## Project structure

See [`docs/01-architecture-overview.md`](docs/01-architecture-overview.md) for the full
breakdown of `app/`, `lib/`, `components/`, `bots/`, and `public/widget.js`, and why each
piece is isolated the way it is.
