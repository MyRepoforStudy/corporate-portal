import { z } from "zod";

export const documentSchema = z.object({
  title: z.string().trim().min(2, "Минимум 2 символа").max(150),
  description: z
    .string()
    .trim()
    .max(300)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  fileUrl: z.string().trim().min(1, "Загрузите файл"),
  fileName: z.string().trim().min(1),
  order: z.coerce.number().int().min(0).max(1000).default(0),
});

export type DocumentInput = z.infer<typeof documentSchema>;
