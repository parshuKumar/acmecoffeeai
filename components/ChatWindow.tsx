// components/ChatWindow.tsx — header, scrollable message list, input.
// Renders inside the iframe (via app/embed/page.tsx), sized ~380x560 by the
// widget's iframe on desktop and full-screen on mobile — this component just
// fills whatever height/width it's given (h-dvh w-full), it never assumes a
// fixed size itself.
"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import MessageBubble, { type MessageRole } from "./MessageBubble";
import { MAX_MESSAGE_LENGTH } from "@/lib/config";

type Message = { role: MessageRole; content: string };
type Status = "idle" | "thinking" | "streaming";

const FALLBACK_ERROR_MESSAGE =
  "Sorry, I'm having trouble answering right now. Please try again in a moment.";

export default function ChatWindow({
  botId,
  botName,
  accentColor,
}: {
  botId: string;
  botName: string;
  accentColor: string;
}) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: `Hi! Ask me anything about ${botName}.` },
  ]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const listRef = useRef<HTMLDivElement>(null);
  const isBusy = status === "thinking" || status === "streaming";

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || isBusy) return;

    // Send recent history (excluding the greeting, which the model never said) for context.
    const history = messages.slice(1);
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setStatus("thinking");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId, question, history }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? FALLBACK_ERROR_MESSAGE);
      }

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      setStatus("streaming");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        const answerSoFar = full;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: answerSoFar };
          return next;
        });
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: FALLBACK_ERROR_MESSAGE }]);
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="flex h-dvh w-full flex-col bg-cream">
      <header
        className="flex items-center gap-3 px-4 py-3 text-cream shadow-sm"
        style={{ backgroundColor: accentColor }}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream/20 font-display text-sm font-semibold">
          {botName.charAt(0)}
        </div>
        <span className="font-display font-semibold">{botName}</span>
      </header>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={m.content} accentColor={accentColor} />
        ))}
        {status === "thinking" && (
          <div className="flex gap-1 px-1" role="status" aria-live="polite" aria-label="Thinking">
            <span className="h-2 w-2 animate-bounce rounded-full bg-espresso/40 [animation-delay:-0.3s] motion-reduce:animate-none" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-espresso/40 [animation-delay:-0.15s] motion-reduce:animate-none" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-espresso/40 motion-reduce:animate-none" />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-espresso/10 p-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
          placeholder="Type your question…"
          disabled={isBusy}
          aria-label="Your question"
          className="flex-1 rounded-full border border-espresso/15 bg-white px-4 py-2 text-sm text-espresso disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isBusy || input.trim().length === 0}
          className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-cream transition-opacity disabled:opacity-40"
          style={{ backgroundColor: accentColor }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
