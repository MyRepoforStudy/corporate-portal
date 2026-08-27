import { z } from "zod";
import { ONBOARDING_STAGES } from "@/lib/compass/mock-data";

const STAGE_IDS = ONBOARDING_STAGES.map((stage) => stage.id) as [string, ...string[]];

export const onboardingTaskSchema = z.object({
  title: z.string().trim().min(2, "Минимум 2 символа").max(150),
  stageId: z.enum(STAGE_IDS, { errorMap: () => ({ message: "Неизвестный этап" }) }),
  order: z.coerce.number().int().min(0).max(1000).default(0),
});

export type OnboardingTaskInput = z.infer<typeof onboardingTaskSchema>;
