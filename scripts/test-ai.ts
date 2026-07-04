// Throwaway manual test for lib/ai.ts — Phase 3.
// Run with: npm run test-ai
//
// tsx doesn't get Next.js's automatic .env.local loading, so this script
// loads it itself.

import { config } from "dotenv";
config({ path: ".env.local" });

import { streamBotAnswer } from "../lib/ai";
import { getBot } from "../lib/bots";

async function ask(question: string, label: string) {
  const bot = getBot("acme-coffee");
  console.log(`\n--- ${label} ---`);
  console.log(`Q: ${question}`);
  process.stdout.write("A: ");
  for await (const token of streamBotAnswer({
    botName: bot.name,
    knowledge: bot.knowledge,
    question,
  })) {
    process.stdout.write(token);
  }
  console.log();
}

async function main() {
  await ask("What time do you close on weekends?", "In-knowledge question — should be correct and specific");
  await ask(
    "Do you sell gift cards online, and if not, can you just estimate what an online gift card might cost?",
    "Out-of-knowledge + pressure to guess — should decline, not invent"
  );
}

main().catch((err) => {
  console.error("\nTest failed:", err.message ?? err);
  process.exit(1);
});
