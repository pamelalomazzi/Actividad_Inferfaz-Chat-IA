import type { KeyboardEvent } from "react";
import type { ChatMessage } from "@/components/chat/types";

type ChatWindowProps = {
  messages: ChatMessage[];
  input: string;
  isLoading: boolean;
  error: string | null;
  onInputChange: (value: string) => void;
  onSend: () => Promise<void>;
  onReset: () => void;
};

export function ChatWindow({
  messages,
  input,
  isLoading,
  error,
  onInputChange,
  onSend,
  onReset,
}: ChatWindowProps) {
  const sendDisabled = isLoading || input.trim().length === 0;

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void onSend();
    }
  }

  return (
    <section className="flex min-h-screen flex-col border-x border-neutral-800/80 bg-neutral-950/85">
      <header className="flex items-center justify-between border-b border-neutral-800/80 px-5 py-4 md:px-7">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-lime-300">Neon Nocturne</p>
          <h1 className="text-lg font-semibold text-white md:text-xl">Chat Window</h1>
        </div>
        <button
          onClick={onReset}
          className="rounded-xl border border-lime-500/70 bg-lime-500 px-4 py-2 text-sm font-semibold text-black hover:bg-lime-400"
        >
          New Session
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6 md:px-8">
        {messages.map((message) => {
          const isUser = message.role === "user";

          return (
            <article
              key={message.id}
              className={[
                "max-w-3xl rounded-2xl border px-4 py-3 md:px-5 md:py-4",
                isUser
                  ? "ml-auto border-lime-500/50 bg-lime-500/10 text-lime-50"
                  : "border-neutral-700 bg-neutral-900/80 text-neutral-100",
              ].join(" ")}
            >
              <div className="mb-2 flex items-center justify-between text-xs font-mono uppercase tracking-wider">
                <span className={isUser ? "text-lime-300" : "text-neutral-400"}>
                  {isUser ? "User" : "Assistant"}
                </span>
                <span className="text-neutral-500">{message.time}</span>
              </div>
              <p className="leading-relaxed">{message.content}</p>
            </article>
          );
        })}
      </div>

      <footer className="border-t border-neutral-800/80 bg-black/40 px-4 py-4 md:px-8 md:py-6">
        <div className="rounded-2xl border border-neutral-700 bg-neutral-900/80 p-3 md:p-4">
          <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-neutral-400">
            Message input
          </label>
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <textarea
              className="min-h-[90px] w-full resize-none rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none ring-lime-500/50 placeholder:text-neutral-500 focus:ring-2"
              placeholder="Escribe tu prompt para Llama 3..."
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              onClick={() => void onSend()}
              disabled={sendDisabled}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-lime-500 px-5 font-semibold text-black hover:bg-lime-400 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400 md:w-auto"
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </div>
          {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
        </div>
      </footer>
    </section>
  );
}
