type BrandMarkProps = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-lime-400/50 bg-neutral-950 shadow-[0_0_32px_rgba(132,204,22,0.18)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(163,230,53,0.34),transparent_42%),linear-gradient(135deg,rgba(10,10,10,0.98),rgba(23,23,23,0.88))]" />
        <svg
          aria-hidden="true"
          viewBox="0 0 64 64"
          className="relative z-10 h-7 w-7 text-lime-300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 46V18H35C41.6274 18 47 23.3726 47 30C47 36.6274 41.6274 42 35 42H20"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {compact ? null : (
        <div>
          <h1 className="text-[11px] uppercase tracking-[0.28em] text-lime-300">Chateando con Pame</h1>
        </div>
      )}
    </div>
  );
}
