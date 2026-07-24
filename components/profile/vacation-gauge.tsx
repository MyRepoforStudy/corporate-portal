const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function VacationGauge({ total, used }: { total: number; used: number }) {
  const remaining = total - used;
  const pct = total > 0 ? Math.min(1, Math.max(0, remaining / total)) : 0;
  const dashOffset = CIRCUMFERENCE * (1 - pct);

  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 80 80" className="h-14 w-14 -rotate-90">
        <circle
          cx="40"
          cy="40"
          r={RADIUS}
          fill="none"
          style={{ stroke: "rgb(var(--c-gray-200))" }}
          strokeWidth="8"
        />
        <circle
          cx="40"
          cy="40"
          r={RADIUS}
          fill="none"
          stroke="#d80010"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-brand-700 dark:text-brand-300">
        {remaining}
      </span>
    </div>
  );
}
