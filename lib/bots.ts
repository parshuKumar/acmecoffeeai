// lib/bots.ts — load + validate a bot config by botId.
// The ONLY place in the app that knows a bot's knowledge currently comes from
// a JSON file in bots/. Swapping this for a database/CMS lookup later only
// means changing what happens inside getBot() — every caller just asks for a
// BotConfig by id and never sees how it was stored.

import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const BotConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  accentColor: z.string().min(1),
  knowledge: z.string().min(1),
});

export type BotConfig = z.infer<typeof BotConfigSchema>;

export class UnknownBotError extends Error {
  constructor(botId: string) {
    super(`Unknown bot: "${botId}"`);
    this.name = "UnknownBotError";
  }
}

// botId arrives from untrusted places (a URL query string, a request body), so
// it's validated before it ever touches the filesystem — this is what rules
// out something like "../../../etc/passwd" as a botId.
const BOT_ID_PATTERN = /^[a-z0-9-]+$/;

const BOTS_DIR = path.join(process.cwd(), "bots");

export function getBot(botId: string): BotConfig {
  if (!BOT_ID_PATTERN.test(botId)) {
    throw new UnknownBotError(botId);
  }

  const filePath = path.join(BOTS_DIR, `${botId}.json`);
  if (!fs.existsSync(filePath)) {
    throw new UnknownBotError(botId);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    throw new UnknownBotError(botId);
  }

  const result = BotConfigSchema.safeParse(raw);
  if (!result.success) {
    throw new UnknownBotError(botId);
  }

  return result.data;
}
