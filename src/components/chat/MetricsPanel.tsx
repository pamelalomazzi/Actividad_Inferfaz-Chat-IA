import type { MetricCard } from "@/components/chat/types";

type MetricsPanelProps = {
  metrics: MetricCard[];
  title: string;
};

export function MetricsPanel({ metrics, title }: MetricsPanelProps) {
  return (
    <aside className="border-l border-neutral-800/80 bg-black/65 p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm uppercase tracking-[0.2em] text-cyan-200">{title}</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {metrics.map((metric) => (
          <article
            key={metric.id}
            className="rounded-xl border border-neutral-700 bg-neutral-900/75 p-4 font-mono"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-neutral-300">{metric.label}</p>
              <p className="break-words text-xl font-semibold text-cyan-100">{metric.value}</p>
            </div>
            {metric.detail ? <p className="mt-1 text-xs text-neutral-500">{metric.detail}</p> : null}
          </article>
        ))}
      </div>
    </aside>
  );
}
