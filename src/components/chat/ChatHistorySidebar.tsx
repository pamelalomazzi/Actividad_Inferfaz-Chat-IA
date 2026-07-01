import { BrandMark } from "@/components/brand/BrandMark";

type SessionListItem = {
  id: string;
  title: string;
};

type ChatHistorySidebarProps = {
  copy: {
    historyTitle: string;
    newButton: string;
    consoleName: string;
    settingsTitle: string;
    themeLabel: string;
    providerLabel: string;
  };
  sessions: SessionListItem[];
  activeSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onCreateSession: () => void;
};

export function ChatHistorySidebar({
  copy,
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
}: ChatHistorySidebarProps) {

  return (
    <aside className="border-r border-neutral-800/80 bg-black/60 p-4">
      <div className="mb-6 border-b border-neutral-800/80 pb-4">
        <BrandMark compact />
        <div className="mt-3 flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-[0.22em] text-lime-300">{copy.historyTitle}</h2>
          <button
            onClick={onCreateSession}
            className="rounded-lg border border-lime-500/70 bg-lime-500/20 px-2 py-1 text-xs font-semibold text-lime-300 hover:bg-lime-500/30"
          >
            {copy.newButton}
          </button>
        </div>
        <p className="mt-2 text-sm text-neutral-400">{copy.consoleName}</p>
      </div>

      <ul className="space-y-2">
        {sessions.map((session) => (
          <li key={session.id}>
            <button
              onClick={() => onSelectSession(session.id)}
              className={[
                "w-full rounded-xl border px-3 py-2 text-left text-sm transition",
                session.id === activeSessionId
                  ? "border-lime-500/50 bg-lime-500/10 text-lime-100"
                  : "border-neutral-700 bg-neutral-900/70 text-neutral-300 hover:border-lime-500/50 hover:text-lime-200",
              ].join(" ")}
            >
              {session.title}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-xl border border-neutral-700 bg-neutral-900/75 p-3 font-mono text-xs text-neutral-400">
        <p className="uppercase tracking-[0.2em] text-neutral-500">{copy.settingsTitle}</p>
        <p className="mt-2">{copy.themeLabel}: <span className="text-lime-300">neon-nocturne</span></p>
        <p>{copy.providerLabel}: <span className="text-lime-300">groq</span></p>
      </div>
    </aside>
  );
}
