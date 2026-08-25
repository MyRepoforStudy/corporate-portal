import { z } from "zod";

export const newsCategorySchema = z.object({
  name: z.string().trim().min(1, "Минимум 1 символ").max(50),
  order: z.coerce.number().int("Должно быть целым числом").min(0).max(10000).default(0),
});

export type NewsCategoryInput = z.infer<typeof newsCategorySchema>;
