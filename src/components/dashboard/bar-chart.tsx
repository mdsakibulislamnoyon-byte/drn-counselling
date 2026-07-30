/** Minimal CSS bar chart — no charting library needed for a handful of bars. */
export function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex h-24 gap-2 border-b border-ink-900/10">
      {data.map((d) => (
        <div key={d.label} className="flex h-full flex-1 flex-col justify-end">
          <div
            className="w-full rounded-t-sm bg-mint-deep"
            style={{ height: `${Math.max((d.value / max) * 100, 4)}%` }}
            title={`${d.label}: ${d.value}`}
          />
        </div>
      ))}
    </div>
  );
}
