import { ONBOARDING_STAGES } from "./mock-data";

export type StageStatus = "completed" | "current" | "upcoming";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function computeStageStatuses(
  hireDate: Date | null,
  now: Date = new Date()
): Record<string, StageStatus> {
  const statuses: Record<string, StageStatus> = {};

  if (!hireDate) {
    for (const stage of ONBOARDING_STAGES) statuses[stage.id] = "upcoming";
    return statuses;
  }

  const daysSinceHire = Math.floor((now.getTime() - hireDate.getTime()) / MS_PER_DAY);

  let currentAssigned = false;
  for (const stage of ONBOARDING_STAGES) {
    if (daysSinceHire >= stage.endDay) {
      statuses[stage.id] = "completed";
    } else if (!currentAssigned) {
      statuses[stage.id] = "current";
      currentAssigned = true;
    } else {
      statuses[stage.id] = "upcoming";
    }
  }

  return statuses;
}

export function getActiveStageId(statuses: Record<string, StageStatus>): string {
  const current = ONBOARDING_STAGES.find((stage) => statuses[stage.id] === "current");
  if (current) return current.id;
  return ONBOARDING_STAGES[ONBOARDING_STAGES.length - 1].id;
}
