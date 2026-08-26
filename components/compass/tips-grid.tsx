import type { CompassTip } from "@prisma/client";

export function TipsGrid({
  tips,
  title,
  emptyText,
}: {
  tips: CompassTip[];
  title: string;
  emptyText: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="mb-3 font-medium text-gray-900">{title}</h2>
      {tips.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyText}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tips.map((tip) => (
            <div key={tip.id} className="rounded-md border border-gray-100 bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-900">{tip.title}</p>
              <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{tip.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
