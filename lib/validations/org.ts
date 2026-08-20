import { z } from "zod";

export const departmentSchema = z.object({
  name: z.string().trim().min(2, "Минимум 2 символа").max(200),
  parentId: z.string().cuid().nullable().optional(),
  headEmployeeId: z.string().cuid().nullable().optional(),
  order: z.coerce.number().int("Должно быть целым числом").min(0).max(10000).default(0),
  isPublished: z.boolean().default(true),
});

export const positionSchema = z.object({
  title: z.string().trim().min(2, "Минимум 2 символа").max(150),
  rank: z.coerce.number().int("Должно быть целым числом").min(0).max(1000).default(0),
});

export const employeeSchema = z.object({
  fullName: z.string().trim().min(2, "Минимум 2 символа").max(200),
  email: z.string().trim().email("Некорректный email"),
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  photoUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  birthDate: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? new Date(v) : undefined)),
  hireDate: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? new Date(v) : undefined)),
  departmentId: z.string().cuid("Выберите отдел"),
  positionId: z.string().cuid("Выберите должность"),
  activityArea: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
});

export const vacationSchema = z.object({
  vacationDaysTotal: z.coerce.number().int("Должно быть целым числом").min(0).max(365),
  vacationDaysUsed: z.coerce.number().int("Должно быть целым числом").min(0).max(365),
});

export type DepartmentInput = z.infer<typeof departmentSchema>;
export type PositionInput = z.infer<typeof positionSchema>;
export type EmployeeInput = z.infer<typeof employeeSchema>;
export type VacationInput = z.infer<typeof vacationSchema>;
