// lib/config.ts — model, provider, and tunable knobs.
// Change values here, not scattered through the app.

// Model provider: Groq's free tier, accessed via the OpenAI SDK pointed at
// Groq's baseURL (Groq mirrors the OpenAI chat-completions API shape).
// See docs/00-model-landscape.md for why Groq was chosen over paid providers,
// and lib/ai.ts for the one place this actually gets used.
export const CHAT_MODEL = "llama-3.1-8b-instant";
export const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

// Input limits, enforced server-side in app/api/chat/route.ts.
export const MAX_MESSAGE_LENGTH = 500;

// Abuse protection — wired up in Phase 7.
export const RATE_LIMIT_PER_MIN = 20;

// How many prior turns of conversation to forward with each request.
export const MAX_HISTORY_MESSAGES = 10;

// Product/branding.
export const SHOW_POWERED_BY = false;
