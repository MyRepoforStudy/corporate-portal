import { VacationGauge } from "@/components/profile/vacation-gauge";

export function VacationCard({
  total,
  used,
  title,
  remainingLabel,
  ofTemplate,
}: {
  total: number;
  used: number;
  title: string;
  remainingLabel: string;
  ofTemplate: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="mb-3 font-medium text-gray-900">{title}</h2>
      <div className="flex items-center gap-4">
        <VacationGauge total={total} used={used} />
        <div>
          <p className="text-xs text-gray-500">{remainingLabel}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {total - used}{" "}
            <span className="text-sm font-normal text-gray-500">
              {ofTemplate.replace("{total}", String(total)).replace("{used}", String(used))}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
