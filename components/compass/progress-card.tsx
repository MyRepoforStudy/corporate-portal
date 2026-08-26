export function ProgressCard({
  done,
  total,
  title,
  motivation,
  doneOfTotalTemplate,
}: {
  done: number;
  total: number;
  title: string;
  motivation: string;
  doneOfTotalTemplate: string;
}) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="mb-3 font-medium text-gray-900">{title}</h2>
      <p className="text-3xl font-semibold text-brand-600">{percent}%</p>
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100"
      >
        <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-sm text-gray-600">
        {doneOfTotalTemplate.replace("{done}", String(done)).replace("{total}", String(total))}
      </p>
      <p className="mt-1 text-sm text-gray-500">{motivation}</p>
    </div>
  );
}
