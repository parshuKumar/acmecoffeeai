# Bot config schema

Each file in `bots/` is one business, named `<bot-id>.json`. `bot-id` is the exact string a
client puts in `data-bot-id="..."` on their embed `<script>` tag, and the exact string passed
as `?botId=...` to `/embed` and `/api/bot-meta`, and as `botId` in the `/api/chat` request body.

| field | type | required | notes |
|---|---|---|---|
| `id` | string | yes | must match the filename (without `.json`); lowercase letters, numbers, hyphens only |
| `name` | string | yes | shown in the chat header and used in the system prompt ("You are {name}'s assistant...") |
| `accentColor` | string (hex) | yes | themes the widget bubble + chat header |
| `knowledge` | string | yes | plain-text business facts, fed verbatim into the system prompt as the ONLY source of truth the bot may answer from |

## Adding a new bot (the Phase 7 rebrand proof)

Adding a new business should require exactly one step: create `bots/<new-id>.json` following
this shape. No code in `lib/`, `app/`, or `public/widget.js` should need to change — a client
switches to the new bot purely by changing `data-bot-id="<new-id>"` on their script tag.

## Future swap point

`lib/bots.ts`'s `getBot()` is the only place that knows knowledge currently comes from a file
in this folder. Swapping this for a database or CMS lookup later only requires changing what's
inside `getBot()` — every caller just asks for a `BotConfig` by id and doesn't know or care
where it came from.
