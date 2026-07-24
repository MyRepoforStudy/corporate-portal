import { z } from "zod";

// Deliberately excludes fullName/department/position/vacation - those are
// HR/Admin-only fields, edited via /api/employees/:id instead.
export const profileSchema = z.object({
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  email: z.string().trim().email("Некорректный email"),
  photoUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  bio: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});

export type ProfileInput = z.infer<typeof profileSchema>;
