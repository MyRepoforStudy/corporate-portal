import type { Locale } from "@/lib/i18n";
import type { AboutFile, AboutFileChapter, AboutFileSection } from "@/lib/validations/about";

/** The texts of a chapter or section in the three portal languages. */
export interface AboutTexts {
  titleRu: string;
  titleKk: string;
  titleKo: string;
  bodyRu: string;
  bodyKk: string;
  bodyKo: string;
}

/** A row of the AboutSection table without the timestamps (what the admin list and the import work with). */
export interface AboutRowLike extends AboutTexts {
  id: string;
  key: string;
  parentId: string | null;
  order: number;
  isPublished: boolean;
}

/** Title and body in `locale`; an empty translation falls back to Russian, the source language. */
export function pickLocalized(row: AboutTexts, locale: Locale): { title: string; body: string } {
  const title = locale === "kk" ? row.titleKk : locale === "ko" ? row.titleKo : row.titleRu;
  const body = locale === "kk" ? row.bodyKk : locale === "ko" ? row.bodyKo : row.bodyRu;
  return {
    title: title.trim() ? title : row.titleRu,
    body: body.trim() ? body : row.bodyRu,
  };
}

/** Which languages of a row have their own text (for the badges in the admin list). */
export function filledLanguages(row: AboutTexts): Record<Locale, boolean> {
  const has = (t: string, b: string) => t.trim() !== "" && (b.trim() !== "" || row.bodyRu.trim() === "");
  return {
    ru: row.titleRu.trim() !== "",
    kk: has(row.titleKk, row.bodyKk),
    ko: has(row.titleKo, row.bodyKo),
  };
}

// --- what the home page shows ------------------------------------------------

export interface AboutSectionView {
  id: string;
  key: string;
  title: string;
  body: string;
}

export interface AboutChapterView extends AboutSectionView {
  sections: AboutSectionView[];
}

function byOrder(a: AboutRowLike, b: AboutRowLike): number {
  return a.order - b.order;
}

/** Published chapters with their published sections, in `locale`. */
export function buildPublicTree(rows: AboutRowLike[], locale: Locale): AboutChapterView[] {
  const view = (row: AboutRowLike): AboutSectionView => ({
    id: row.id,
    key: row.key,
    ...pickLocalized(row, locale),
  });

  return rows
    .filter((row) => row.parentId === null && row.isPublished)
    .sort(byOrder)
    .map((chapter) => ({
      ...view(chapter),
      sections: rows
        .filter((row) => row.parentId === chapter.id && row.isPublished)
        .sort(byOrder)
        .map(view),
    }));
}

// --- JSON export / import ------------------------------------------------------

type Localized = { ru?: string; kk?: string; ko?: string };

function compact(ru: string, kk: string, ko: string): Localized | undefined {
  const value: Localized = {};
  if (ru.trim()) value.ru = ru;
  if (kk.trim()) value.kk = kk;
  if (ko.trim()) value.ko = ko;
  return Object.keys(value).length > 0 ? value : undefined;
}

/** Everything (all languages, unpublished too) as the file the import understands. */
export function buildAboutFile(rows: AboutRowLike[]): AboutFile {
  const toFile = (row: AboutRowLike): AboutFileSection => ({
    key: row.key,
    isPublished: row.isPublished,
    title: compact(row.titleRu, row.titleKk, row.titleKo),
    body: compact(row.bodyRu, row.bodyKk, row.bodyKo),
  });

  const chapters: AboutFileChapter[] = rows
    .filter((row) => row.parentId === null)
    .sort(byOrder)
    .map((chapter) => ({
      ...toFile(chapter),
      sections: rows
        .filter((row) => row.parentId === chapter.id)
        .sort(byOrder)
        .map(toFile),
    }));

  return { version: 1, chapters };
}

export interface AboutImportOp {
  kind: "chapter" | "section";
  op: "create" | "update";
  key: string;
  /** Key of the chapter a section belongs to (null for chapters). */
  parentKey: string | null;
  /** Position among its siblings in the file (used when the row is created). */
  order: number;
  /** For `create` the whole row, for `update` only the fields that really change. */
  data: Partial<AboutTexts> & { isPublished?: boolean };
}

export interface AboutImportPlan {
  ops: AboutImportOp[];
  unchanged: number;
  errors: { where: string; message: string }[];
}

const clean = (text: string | undefined): string => (text ?? "").replace(/\r\n?/g, "\n").trim();

/**
 * What an import would do, without touching the database. Rows are matched by `key`.
 * A new row needs a Russian title; for an existing row only the languages present
 * (and non-empty) in the file are written, so a file with just the Kazakh texts
 * adds them and leaves Russian and the order alone.
 */
export function planAboutImport(existing: AboutRowLike[], file: AboutFile): AboutImportPlan {
  const byKey = new Map(existing.map((row) => [row.key, row]));
  const seen = new Set<string>();
  const plan: AboutImportPlan = { ops: [], unchanged: 0, errors: [] };

  function plan1(
    item: AboutFileSection,
    kind: "chapter" | "section",
    parentKey: string | null,
    order: number,
    label: string
  ): boolean {
    if (seen.has(item.key)) {
      plan.errors.push({ where: label, message: `ключ «${item.key}» встречается в файле повторно` });
      return false;
    }
    seen.add(item.key);

    const incoming: Partial<AboutTexts> = {};
    const set = (field: keyof AboutTexts, value: string | undefined) => {
      const text = clean(value);
      if (text) incoming[field] = text;
    };
    set("titleRu", item.title?.ru);
    set("titleKk", item.title?.kk);
    set("titleKo", item.title?.ko);
    set("bodyRu", item.body?.ru);
    set("bodyKk", item.body?.kk);
    set("bodyKo", item.body?.ko);

    const current = byKey.get(item.key);
    if (!current) {
      if (!incoming.titleRu || incoming.titleRu.length < 2) {
        plan.errors.push({ where: label, message: `нового ${kind === "chapter" ? "главы" : "раздела"} нет русского заголовка` });
        return false;
      }
      plan.ops.push({
        kind,
        op: "create",
        key: item.key,
        parentKey,
        order,
        data: { ...incoming, isPublished: item.isPublished ?? true },
      });
      return true;
    }

    const changes: AboutImportOp["data"] = {};
    for (const [field, value] of Object.entries(incoming) as [keyof AboutTexts, string][]) {
      if (current[field] !== value) changes[field] = value;
    }
    if (item.isPublished !== undefined && item.isPublished !== current.isPublished) {
      changes.isPublished = item.isPublished;
    }
    if (Object.keys(changes).length === 0) {
      plan.unchanged += 1;
    } else {
      plan.ops.push({ kind, op: "update", key: item.key, parentKey, order, data: changes });
    }
    return true;
  }

  file.chapters.forEach((chapter, ci) => {
    const chapterOk = plan1(chapter, "chapter", null, ci, `Глава ${ci + 1} («${chapter.key}»)`);
    chapter.sections.forEach((section, si) => {
      if (!chapterOk && !byKey.has(chapter.key)) {
        plan.errors.push({
          where: `Раздел «${section.key}»`,
          message: `пропущен: глава «${chapter.key}» не создана`,
        });
        return;
      }
      plan1(section, "section", chapter.key, si, `Раздел «${section.key}» главы «${chapter.key}»`);
    });
  });

  return plan;
}
