import { z } from "zod";

export const newsCommentSchema = z.object({
  content: z.string().trim().min(1, "Введите текст комментария").max(1000),
});

export type NewsCommentInput = z.infer<typeof newsCommentSchema>;
