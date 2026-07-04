// lib/rateLimit.ts — a simple per-key, per-minute in-memory rate limiter.
//
// This state lives in a single Node process's memory. On Vercel, serverless
// function instances can be recycled or run across multiple regions, so this
// count can reset in ways a real, shared limiter wouldn't — good enough to
// stop casual abuse and demonstrate the concept at demo scale, not a hard
// guarantee under real production traffic. A version handling that would back
// this with a shared store (e.g. Redis) instead, behind the same function
// signature so nothing else in the app would need to change.

const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

export function isRateLimited(key: string, limitPerMinute: number): boolean {
  const now = Date.now();
  const recentHits = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recentHits.push(now);
  hits.set(key, recentHits);
  return recentHits.length > limitPerMinute;
}
