import type { KeyboardEvent } from "react";
import { BrandMark } from "@/components/brand/BrandMark";
import type { ChatMessage } from "@/components/chat/types";

type ChatWindowProps = {
  messages: ChatMessage[];
  input: string;
  isLoading: boolean;
  error: string | null;
  language: "es" | "en";
  copy: {
    subtitle: string;
    clearConversation: string;
    roleUser: string;
    roleAssistant: string;
    messageInput: string;
    placeholder: string;
    sending: string;
    send: string;
    languageLabel: string;
  };
  onInputChange: (value: string) => void;
  onLanguageChange: (value: "es" | "en") => void;
  onSend: () => Promise<void>;
  onReset: () => void;
};

export function ChatWindow({
  messages,
  input,
  isLoading,
  error,
  language,
  copy,
  onInputChange,
  onLanguageChange,
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
      <header className="flex items-center justify-between border-b border-neutral-800/80 bg-black/25 px-5 py-4 backdrop-blur-sm md:px-7">
        <div className="flex items-center gap-4">
          <BrandMark />
          <div className="hidden md:block">
            <p className="text-sm text-neutral-400">{copy.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onLanguageChange(language === "es" ? "en" : "es")}
            className="rounded-xl border border-cyan-400/50 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.18)] transition hover:border-cyan-300/80 hover:bg-cyan-500/20"
            aria-label={copy.languageLabel}
          >
            {language === "es" ? "ES" : "EN"}
          </button>
          <button
            onClick={onReset}
            className="group inline-flex items-center gap-2 rounded-xl border border-lime-400/55 bg-gradient-to-r from-lime-500/25 to-cyan-400/20 px-4 py-2 text-sm font-semibold text-lime-50 shadow-[0_0_24px_rgba(132,204,22,0.2)] transition hover:border-lime-300/85 hover:from-lime-500/35 hover:to-cyan-400/30"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4 text-lime-200 transition group-hover:text-lime-100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 7H20"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M9 7V5.5C9 4.67 9.67 4 10.5 4H13.5C14.33 4 15 4.67 15 5.5V7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M7.5 7L8.2 18.3C8.26 19.24 9.04 20 9.98 20H14.02C14.96 20 15.74 19.24 15.8 18.3L16.5 7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path d="M10 10.5V16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M14 10.5V16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {copy.clearConversation}
          </button>
        </div>
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
                  {isUser ? copy.roleUser : copy.roleAssistant}
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
            {copy.messageInput}
          </label>
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <textarea
              className="min-h-[90px] w-full resize-none rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none ring-lime-500/50 placeholder:text-neutral-500 focus:ring-2"
              placeholder={copy.placeholder}
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
              {isLoading ? copy.sending : copy.send}
            </button>
          </div>
          {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
        </div>
      </footer>
    </section>
  );
}
