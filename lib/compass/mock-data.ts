// The 5 onboarding stages are a fixed structural timeline, not admin
// content - `endDay` drives computeStageStatuses() (lib/compass/stage-status.ts):
// a stage is "completed" once that many days have passed since the
// employee's real hireDate. The tasks shown within each stage, and their
// completion state, are real data now (OnboardingTask in the DB, admin-managed
// via /admin/compass; completion is tracked client-side per user, see
// components/compass/onboarding-interactive.tsx).

export type StageTitleKey = "beforeStart" | "firstDay" | "firstWeek" | "firstMonth" | "ninetyDays";

export interface OnboardingStageMeta {
  id: string;
  titleKey: StageTitleKey;
  endDay: number;
}

export const ONBOARDING_STAGES: OnboardingStageMeta[] = [
  { id: "before-start", titleKey: "beforeStart", endDay: 0 },
  { id: "first-day", titleKey: "firstDay", endDay: 1 },
  { id: "first-week", titleKey: "firstWeek", endDay: 7 },
  { id: "first-month", titleKey: "firstMonth", endDay: 30 },
  { id: "ninety-days", titleKey: "ninetyDays", endDay: 90 },
];
