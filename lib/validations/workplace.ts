import { z } from "zod";

export const workplaceSchema = z.object({
  building: z
    .string()
    .trim()
    .max(100)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  floor: z.coerce.number().int("Этаж должен быть числом").min(-5).max(200),
  room: z.string().trim().min(1, "Укажите кабинет/зону").max(100),
  deskNumber: z.string().trim().min(1, "Укажите номер места").max(50),
});

export type WorkplaceInput = z.infer<typeof workplaceSchema>;
