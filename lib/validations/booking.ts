import { z } from "zod";

export const recurrenceSchema = z.object({
  frequency: z.enum(["DAILY", "WEEKLY"]),
  until: z.coerce.date(),
});

const MAX_RECURRENCE_OCCURRENCES = 52;

export const createBookingSchema = z
  .object({
    roomId: z.string().cuid("Выберите переговорную"),
    topic: z.string().trim().min(2, "Минимум 2 символа").max(200),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    participantIds: z.array(z.string().cuid()).max(50).default([]),
    recurrence: recurrenceSchema.optional(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "Время окончания должно быть позже времени начала",
    path: ["endTime"],
  })
  .refine((data) => data.startTime.getTime() >= Date.now() - 60_000, {
    message: "Нельзя бронировать время в прошлом",
    path: ["startTime"],
  })
  .refine(
    (data) => data.endTime.getTime() - data.startTime.getTime() <= 8 * 60 * 60 * 1000,
    {
      message: "Максимальная длительность брони — 8 часов",
      path: ["endTime"],
    }
  )
  .refine(
    (data) => {
      if (!data.recurrence) return true;
      const stepDays = data.recurrence.frequency === "DAILY" ? 1 : 7;
      const spanMs = data.recurrence.until.getTime() - data.startTime.getTime();
      const occurrences = Math.floor(spanMs / (stepDays * 24 * 60 * 60 * 1000)) + 1;
      return occurrences > 0 && occurrences <= MAX_RECURRENCE_OCCURRENCES;
    },
    {
      message: `Слишком длинная серия повторов (максимум ${MAX_RECURRENCE_OCCURRENCES} встреч)`,
      path: ["recurrence"],
    }
  );

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const roomSchema = z.object({
  name: z.string().trim().min(2, "Минимум 2 символа").max(150),
  capacity: z.coerce.number().int().min(1).max(500),
  floor: z.coerce.number().int().min(-5).max(200),
  equipment: z.array(z.string().trim().min(1)).default([]),
  isActive: z.boolean().default(true),
});

export type RoomInput = z.infer<typeof roomSchema>;
