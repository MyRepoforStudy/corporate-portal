import { z } from "zod";

export const teamSpotlightSchema = z.object({
  imageUrl: z.string().trim().min(1, "Загрузите фото").max(500),
  caption: z.string().trim().min(2, "Минимум 2 символа").max(200),
  order: z.coerce.number().int().min(0).max(1000).default(0),
});

export type TeamSpotlightInput = z.infer<typeof teamSpotlightSchema>;
