// app/embed/page.tsx — the chat UI that renders INSIDE the widget's iframe.
//
// This is a Server Component: it reads ?botId= and calls getBot() directly on
// the server, so the browser only ever receives {botId, name, accentColor} as
// props — never the bot's full knowledge string. No separate "bot-meta" API
// route is needed for this; a server component can just do the lookup itself.

import { getBot, UnknownBotError } from "@/lib/bots";
import ChatWindow from "@/components/ChatWindow";

export default function EmbedPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const botIdParam = searchParams.botId;
  const botId = typeof botIdParam === "string" ? botIdParam : undefined;

  if (!botId) {
    return <UnavailableState message="This chat widget is missing a bot ID." />;
  }

  try {
    const bot = getBot(botId);
    return <ChatWindow botId={bot.id} botName={bot.name} accentColor={bot.accentColor} />;
  } catch (err) {
    if (err instanceof UnknownBotError) {
      return <UnavailableState message="This chat widget isn't configured correctly." />;
    }
    throw err;
  }
}

function UnavailableState({ message }: { message: string }) {
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-cream p-6 text-center">
      <p className="text-sm text-espresso/70">{message}</p>
    </div>
  );
}
