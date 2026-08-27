import { z } from "zod";

export const itRequestSchema = z.object({
  subject: z.string().trim().min(2, "Минимум 2 символа").max(150),
  description: z.string().trim().min(2, "Минимум 2 символа").max(2000),
});

export type ItRequestInput = z.infer<typeof itRequestSchema>;
