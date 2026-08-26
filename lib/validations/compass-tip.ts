import { z } from "zod";

export const compassTipSchema = z.object({
  title: z.string().trim().min(2, "Минимум 2 символа").max(100),
  content: z.string().trim().min(2, "Минимум 2 символа").max(2000),
  order: z.coerce.number().int().min(0).max(1000).default(0),
});

export type CompassTipInput = z.infer<typeof compassTipSchema>;
