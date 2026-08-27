import { z } from "zod";

export const announcementSchema = z.object({
  title: z.string().trim().min(2, "Минимум 2 символа").max(200),
  order: z.coerce.number().int().min(0).max(1000).default(0),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;
