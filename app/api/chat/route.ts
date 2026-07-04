// app/api/chat/route.ts — POST { botId, question, history? } -> streamed grounded answer.
//
// CORS-enabled: /embed and this route are same-origin today (both served by
// this one Next.js app), but this endpoint is designed to be safely callable
// from a DIFFERENT origin — a widget embedded on a client's website — so the
// headers are here from the start. See docs/06-phase-4-chat-api-cors.md.
//
// A browser sends an OPTIONS "preflight" request before certain cross-origin
// requests (a JSON POST like this one qualifies) to ask permission before
// sending the real request. We answer that preflight, and also attach the
// same CORS header to the real response, since browsers check both.

import { NextRequest } from "next/server";
import { getBot, UnknownBotError } from "@/lib/bots";
import { streamBotAnswer, type ChatMessage } from "@/lib/ai";
import { MAX_MESSAGE_LENGTH, MAX_HISTORY_MESSAGES, RATE_LIMIT_PER_MIN } from "@/lib/config";
import { isRateLimited } from "@/lib/rateLimit";

const RATE_LIMIT_MESSAGE =
  "You're sending messages a little fast — give me a moment! Please wait about a minute before trying again.";

function getClientKey(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

// Permissive for this demo. A version serving real paying clients would
// allowlist each client's own domain per botId instead of "*".
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonError(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

// Same shape as a real streamed answer (200, text/plain) so the widget's UI
// doesn't need any special-case handling for "you're being rate limited" —
// it just renders as a normal bot message.
function textResponse(text: string) {
  return new Response(text, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8", ...CORS_HEADERS },
  });
}

function isValidHistory(value: unknown): value is ChatMessage[] {
  return (
    Array.isArray(value) &&
    value.every(
      (m) =>
        m &&
        typeof m === "object" &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
    )
  );
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Request body must be valid JSON.");
  }

  if (typeof body !== "object" || body === null) {
    return jsonError(400, "Request body must be a JSON object.");
  }

  const { botId, question, history } = body as Record<string, unknown>;

  if (typeof botId !== "string" || botId.length === 0) {
    return jsonError(400, "botId is required.");
  }

  if (typeof question !== "string" || question.trim().length === 0) {
    return jsonError(400, "question is required.");
  }
  const trimmedQuestion = question.trim();
  if (trimmedQuestion.length > MAX_MESSAGE_LENGTH) {
    return jsonError(400, `question must be ${MAX_MESSAGE_LENGTH} characters or fewer.`);
  }

  if (isRateLimited(getClientKey(req), RATE_LIMIT_PER_MIN)) {
    return textResponse(RATE_LIMIT_MESSAGE);
  }

  let safeHistory: ChatMessage[] = [];
  if (history !== undefined) {
    if (!isValidHistory(history)) {
      return jsonError(400, "history must be an array of { role, content } messages.");
    }
    // Cap regardless of what the client sent — never trust client-side limits alone.
    safeHistory = history.slice(-MAX_HISTORY_MESSAGES);
  }

  let bot;
  try {
    bot = getBot(botId);
  } catch (err) {
    if (err instanceof UnknownBotError) {
      return jsonError(404, "Unknown bot.");
    }
    throw err;
  }

  const generator = streamBotAnswer({
    botName: bot.name,
    knowledge: bot.knowledge,
    question: trimmedQuestion,
    history: safeHistory,
  });

  // Pull the first token before committing to a streamed 200 response. If the
  // model call fails outright (bad/missing key, Groq unreachable, retries
  // exhausted), it throws here, before any headers are sent — so we can still
  // return a clean 502 instead of a 200 with a broken body.
  let first: IteratorResult<string>;
  try {
    first = await generator.next();
  } catch (err) {
    console.error("[api/chat] AI layer failed before first token:", err);
    return jsonError(502, "Sorry, I'm having trouble answering right now. Please try again in a moment.");
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (!first.done && first.value) {
          controller.enqueue(encoder.encode(first.value));
        }
        for await (const token of generator) {
          controller.enqueue(encoder.encode(token));
        }
      } catch (err) {
        // Rare: the model call fails after some tokens already streamed.
        // Status is already committed to 200, so the best we can do is
        // append a friendly note and close cleanly, never a raw stack trace.
        console.error("[api/chat] AI layer failed mid-stream:", err);
        controller.enqueue(
          encoder.encode("\n\n[Sorry, something went wrong finishing that answer. Please try again.]")
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      ...CORS_HEADERS,
    },
  });
}
