import { z } from "zod";

export const recognitionSchema = z.object({
  toEmployeeId: z.string().min(1, "Выберите сотрудника"),
  title: z.string().trim().min(2, "Минимум 2 символа").max(100),
  message: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});

export type RecognitionInput = z.infer<typeof recognitionSchema>;
