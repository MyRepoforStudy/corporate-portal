import { z } from "zod";

/** Stable slug of a chapter/section: what the JSON import/export matches rows by. */
export const ABOUT_KEY_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

export const ABOUT_TITLE_MAX = 200;
export const ABOUT_BODY_MAX = 30000;

const keySchema = z
  .string()
  .trim()
  .regex(ABOUT_KEY_RE, "Ключ: латиница в нижнем регистре, цифры и дефис (до 64 символов)");

const title = z.string().trim().max(ABOUT_TITLE_MAX, `Не длиннее ${ABOUT_TITLE_MAX} символов`);
const body = z.string().max(ABOUT_BODY_MAX, `Текст не длиннее ${ABOUT_BODY_MAX} символов`);

/** Create / update of one chapter or section from the admin UI. */
export const aboutSectionSchema = z.object({
  parentId: z.string().min(1).nullable().default(null),
  isPublished: z.boolean().default(true),
  titleRu: title.min(2, "Укажите русский заголовок (минимум 2 символа)"),
  titleKk: title.default(""),
  titleKo: title.default(""),
  bodyRu: body.default(""),
  bodyKk: body.default(""),
  bodyKo: body.default(""),
});

export type AboutSectionInput = z.infer<typeof aboutSectionSchema>;

export const aboutMoveSchema = z.object({
  direction: z.enum(["up", "down"]),
});

// --- JSON file for import / export -------------------------------------------

const localizedTitle = z.object({ ru: title.optional(), kk: title.optional(), ko: title.optional() });
const localizedBody = z.object({ ru: body.optional(), kk: body.optional(), ko: body.optional() });

const fileSection = z.object({
  key: keySchema,
  isPublished: z.boolean().optional(),
  title: localizedTitle.optional(),
  body: localizedBody.optional(),
});

const fileChapter = fileSection.extend({
  sections: z.array(fileSection).default([]),
});

export const aboutFileSchema = z.object({
  version: z.literal(1).optional(),
  chapters: z.array(fileChapter).min(1, "В файле нет ни одной главы"),
});

export type AboutFile = z.infer<typeof aboutFileSchema>;
export type AboutFileSection = z.infer<typeof fileSection>;
export type AboutFileChapter = z.infer<typeof fileChapter>;
