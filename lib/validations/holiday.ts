import { z } from "zod";

export const holidaySchema = z.object({
  title: z.string().trim().min(2, "Минимум 2 символа").max(150),
  date: z.coerce.date(),
});

export type HolidayInput = z.infer<typeof holidaySchema>;
