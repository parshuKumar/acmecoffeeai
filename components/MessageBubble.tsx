// components/MessageBubble.tsx — a single chat message bubble.

export type MessageRole = "user" | "assistant";

export default function MessageBubble({
  role,
  content,
  accentColor,
}: {
  role: MessageRole;
  content: string;
  accentColor: string;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-relaxed ${
          isUser ? "text-cream" : "bg-cream-dark text-espresso"
        }`}
        style={isUser ? { backgroundColor: accentColor } : undefined}
      >
        {content}
      </div>
    </div>
  );
}
