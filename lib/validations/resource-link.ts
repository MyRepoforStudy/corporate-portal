import { z } from "zod";

export const resourceLinkSchema = z.object({
  title: z.string().trim().min(2, "Минимум 2 символа").max(100),
  url: z.string().trim().url("Укажите полную ссылку, например https://wiki.bank.local"),
  description: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  order: z.coerce.number().int().min(0).max(1000).default(0),
});

export type ResourceLinkInput = z.infer<typeof resourceLinkSchema>;
