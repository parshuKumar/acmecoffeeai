// Throwaway manual test for lib/bots.ts — Phase 2.
// Run with: npm run test-bot

import { getBot, UnknownBotError } from "../lib/bots";

const bot = getBot("acme-coffee");
console.log("id:          ", bot.id);
console.log("name:        ", bot.name);
console.log("accentColor: ", bot.accentColor);
console.log("knowledge:   ", bot.knowledge.slice(0, 100) + "...");

console.log("\nTrying an unknown bot id...");
try {
  getBot("does-not-exist");
  console.error("FAIL: expected getBot to throw for an unknown bot id");
  process.exit(1);
} catch (err) {
  if (err instanceof UnknownBotError) {
    console.log("OK: threw UnknownBotError ->", err.message);
  } else {
    console.error("FAIL: threw the wrong error type ->", err);
    process.exit(1);
  }
}

console.log("\nTrying a path-traversal-ish bot id...");
try {
  getBot("../../etc/passwd");
  console.error("FAIL: expected getBot to throw for a path-traversal id");
  process.exit(1);
} catch (err) {
  if (err instanceof UnknownBotError) {
    console.log("OK: threw UnknownBotError ->", err.message);
  } else {
    console.error("FAIL: threw the wrong error type ->", err);
    process.exit(1);
  }
}
