# AI Chatbot Widget

An embeddable AI chat widget: paste one `<script>` tag into any website and a chat bubble
appears that answers questions about that business — grounded only in facts you provide,
streamed token-by-token, fully isolated from the host page via an iframe.

This repo is being built in 8 phases. See [`docs/`](docs/README.md) for the full plan, the
architecture reasoning, and a phase-by-phase build guide — start there.

## Status

Phase 1 (scaffold + fake demo host page) in progress. No AI or widget logic yet.

## Local setup

```bash
npm install
cp .env.example .env.local   # then paste your Groq API key into .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the fake "Acme Coffee"
demo site the widget will eventually live on.

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `GROQ_API_KEY` | Yes (from Phase 3 onward) | Free API key from [console.groq.com/keys](https://console.groq.com/keys) — see `docs/00-model-landscape.md` for why Groq |

## Embed snippet (coming in Phase 6)

```html
<script src="https://your-app.vercel.app/widget.js" data-bot-id="acme-coffee"></script>
```
