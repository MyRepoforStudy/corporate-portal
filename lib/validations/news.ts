import { z } from "zod";

export const newsSchema = z.object({
  title: z.string().trim().min(2, "Минимум 2 символа").max(200),
  content: z.string().trim().min(2, "Минимум 2 символа").max(5000),
  imageUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  documentUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  documentName: z
    .string()
    .trim()
    .max(255)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  isPublished: z.boolean().default(true),
  isPinned: z.boolean().default(false),
});

export type NewsInput = z.infer<typeof newsSchema>;
