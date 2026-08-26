import { Check } from "lucide-react";
import type { StageStatus } from "@/lib/compass/stage-status";

interface RoadmapStage {
  id: string;
  title: string;
  status: StageStatus;
}

function StageDot({ stage, index, isActive }: { stage: RoadmapStage; index: number; isActive: boolean }) {
  const base = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-medium transition";
  const byStatus =
    stage.status === "completed"
      ? "border-brand-600 bg-brand-600 text-white"
      : stage.status === "current"
        ? "border-brand-600 bg-white text-brand-600 ring-2 ring-brand-100"
        : "border-gray-300 bg-white text-gray-400";

  return (
    <span className={`${base} ${byStatus} ${isActive ? "scale-110" : ""}`}>
      {stage.status === "completed" ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
    </span>
  );
}

export function OnboardingRoadmap({
  stages,
  activeStageId,
  onSelect,
  title,
  statusLabels,
}: {
  stages: RoadmapStage[];
  activeStageId: string;
  onSelect: (id: string) => void;
  title: string;
  statusLabels: Record<StageStatus, string>;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="mb-4 font-medium text-gray-900">{title}</h2>
      <div className="flex flex-col sm:flex-row sm:items-start">
        {stages.map((stage, i) => {
          const isActive = stage.id === activeStageId;
          return (
            <div key={stage.id} className="flex sm:flex-1 sm:flex-col">
              <div className="flex items-center gap-3 sm:w-full sm:flex-col sm:gap-2">
                <div className="flex items-center sm:w-full">
                  {i > 0 && <span className="hidden h-px flex-1 bg-gray-200 sm:block" aria-hidden="true" />}
                  <button
                    type="button"
                    onClick={() => onSelect(stage.id)}
                    aria-current={isActive ? "step" : undefined}
                    aria-label={`${stage.title}: ${statusLabels[stage.status]}`}
                  >
                    <StageDot stage={stage} index={i} isActive={isActive} />
                  </button>
                  {i < stages.length - 1 && <span className="hidden h-px flex-1 bg-gray-200 sm:block" aria-hidden="true" />}
                </div>
                <button
                  type="button"
                  onClick={() => onSelect(stage.id)}
                  className={`text-left text-sm transition sm:text-center ${
                    isActive ? "font-medium text-gray-900" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {stage.title}
                </button>
              </div>
              {i < stages.length - 1 && (
                <span className="ml-4 mt-1 block h-5 w-px bg-gray-200 sm:hidden" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
