// Onboarding stages/tasks have no backend concept yet - this is the mock
// scaffold the "Компас новичка" page renders against. `endDay` drives
// computeStageStatuses() (lib/compass/stage-status.ts): a stage is
// "completed" once that many days have passed since the employee's real
// hireDate. Task completion is tracked client-side (see
// components/compass/onboarding-interactive.tsx), not here.

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

export type TaskTitleKey =
  | "pass"
  | "laptop"
  | "email"
  | "meetTeam"
  | "induction"
  | "systems"
  | "firstOneOnOne"
  | "trainingCourses"
  | "probationCheckin";

export interface OnboardingTaskMeta {
  id: string;
  titleKey: TaskTitleKey;
  stageId: string;
}

export const ONBOARDING_TASKS: OnboardingTaskMeta[] = [
  { id: "pass", titleKey: "pass", stageId: "before-start" },
  { id: "laptop", titleKey: "laptop", stageId: "first-day" },
  { id: "email", titleKey: "email", stageId: "first-day" },
  { id: "meet-team", titleKey: "meetTeam", stageId: "first-day" },
  { id: "induction", titleKey: "induction", stageId: "first-week" },
  { id: "systems", titleKey: "systems", stageId: "first-week" },
  { id: "one-on-one", titleKey: "firstOneOnOne", stageId: "first-month" },
  { id: "training", titleKey: "trainingCourses", stageId: "first-month" },
  { id: "probation-checkin", titleKey: "probationCheckin", stageId: "ninety-days" },
];
