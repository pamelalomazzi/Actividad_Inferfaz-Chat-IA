import type { MetricCard } from "@/components/chat/types";

type MetricsPanelProps = {
  metrics: MetricCard[];
};

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  return (
    <aside className="border-l border-neutral-800/80 bg-black/65 p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm uppercase tracking-[0.2em] text-neutral-300">Metrics</h2>
        <span className="rounded-full border border-lime-500/60 bg-lime-500/20 px-2 py-1 text-xs font-mono text-lime-300">
          mock
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {metrics.map((metric) => (
          <article
            key={metric.id}
            className="rounded-xl border border-neutral-700 bg-neutral-900/75 p-4 font-mono"
          >
            <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400">{metric.label}</p>
            <p className="mt-2 break-words text-2xl font-semibold text-lime-300">{metric.value}</p>
            <p className="mt-1 text-xs text-neutral-500">{metric.detail}</p>
          </article>
        ))}
      </div>
    </aside>
  );
}
