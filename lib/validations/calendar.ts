import { z } from "zod";

export const holidaySchema = z.object({
  title: z.string().trim().min(2, "Минимум 2 символа").max(200),
  date: z.coerce.date(),
});

export const vacationEntrySchema = z
  .object({
    employeeId: z.string().cuid("Выберите сотрудника"),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "Дата окончания раньше даты начала",
    path: ["endDate"],
  });

export type HolidayInput = z.infer<typeof holidaySchema>;
export type VacationEntryInput = z.infer<typeof vacationEntrySchema>;
