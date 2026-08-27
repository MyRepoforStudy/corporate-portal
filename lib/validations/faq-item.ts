import { z } from "zod";

export const faqItemSchema = z.object({
  question: z.string().trim().min(2, "Минимум 2 символа").max(200),
  answer: z.string().trim().min(2, "Минимум 2 символа").max(1000),
  order: z.coerce.number().int().min(0).max(1000).default(0),
});

export type FaqItemInput = z.infer<typeof faqItemSchema>;
