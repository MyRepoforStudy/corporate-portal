import { z } from "zod";

export const birthdayGreetingSchema = z.object({
  toEmployeeId: z.string().cuid(),
  message: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  anonymous: z.boolean().default(false),
});

export type BirthdayGreetingInput = z.infer<typeof birthdayGreetingSchema>;
