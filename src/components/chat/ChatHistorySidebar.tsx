import { BrandMark } from "@/components/brand/BrandMark";

export function ChatHistorySidebar() {
  const sessions = ["Sprint planning", "API debug", "Prompt tuning", "Night build"];

  return (
    <aside className="border-r border-neutral-800/80 bg-black/60 p-4">
      <div className="mb-6 border-b border-neutral-800/80 pb-4">
        <BrandMark compact />
        <div className="mt-3 flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-[0.22em] text-lime-300">History</h2>
          <button className="rounded-lg border border-lime-500/70 bg-lime-500/20 px-2 py-1 text-xs font-semibold text-lime-300 hover:bg-lime-500/30">
            New
          </button>
        </div>
        <p className="mt-2 text-sm text-neutral-400">Nocturne AI console</p>
      </div>

      <ul className="space-y-2">
        {sessions.map((session, idx) => (
          <li key={session}>
            <button
              className={[
                "w-full rounded-xl border px-3 py-2 text-left text-sm transition",
                idx === 0
                  ? "border-lime-500/50 bg-lime-500/10 text-lime-100"
                  : "border-neutral-700 bg-neutral-900/70 text-neutral-300 hover:border-lime-500/50 hover:text-lime-200",
              ].join(" ")}
            >
              {session}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-xl border border-neutral-700 bg-neutral-900/75 p-3 font-mono text-xs text-neutral-400">
        <p className="uppercase tracking-[0.2em] text-neutral-500">Settings</p>
        <p className="mt-2">theme: <span className="text-lime-300">neon-nocturne</span></p>
        <p>provider: <span className="text-lime-300">groq</span></p>
      </div>
    </aside>
  );
}
