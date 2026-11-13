/**
 * Photos in the JSON file for "О нас". The file cannot carry the pictures
 * themselves (they are far too big for JSON), so a text refers to a photo by the
 * name of a file that is chosen next to the JSON in the import window:
 *
 *     ![Руководство](about-img:leadership.jpg)
 *
 * The browser uploads the chosen files one by one, and these helpers swap every
 * `about-img:NAME` for the address the portal gave the uploaded file
 * (`/uploads/<uuid>.jpg`) - or remove the photo, when no file with that name was
 * chosen, so that no dead reference is stored. Pure functions: no I/O.
 */

const PLACEHOLDER = /!\[([^\]\n]*)\]\(about-img:([A-Za-z0-9._-]+)\)/g;

type Lang = "ru" | "kk" | "ko";
const LANGS: Lang[] = ["ru", "kk", "ko"];

/** Calls `fn` for every language text (`body`) of every chapter and section of a (not yet validated) file. */
function forEachBody(file: unknown, fn: (body: Record<Lang, string>, lang: Lang) => void): void {
  const chapters = (file as { chapters?: unknown })?.chapters;
  if (!Array.isArray(chapters)) return;
  for (const chapter of chapters) {
    const sections = Array.isArray(chapter?.sections) ? chapter.sections : [];
    for (const item of [chapter, ...sections]) {
      const body = item?.body;
      if (!body || typeof body !== "object") continue;
      for (const lang of LANGS) {
        if (typeof body[lang] === "string") fn(body, lang);
      }
    }
  }
}

/** Names of the photos a file refers to, each once, in the order of appearance. */
export function collectImageRefs(file: unknown): string[] {
  const names: string[] = [];
  forEachBody(file, (body, lang) => {
    for (const match of body[lang].matchAll(PLACEHOLDER)) {
      if (!names.includes(match[2])) names.push(match[2]);
    }
  });
  return names;
}

/**
 * A copy of the file in which `about-img:NAME` is replaced by `urls[NAME]`. A photo
 * without an address is cut out of the text (with the empty line it leaves) and its
 * name is returned in `missing`. Texts without placeholders are left exactly as they were.
 */
export function applyImageUrls(
  file: unknown,
  urls: Record<string, string>
): { file: unknown; missing: string[] } {
  const copy = JSON.parse(JSON.stringify(file));
  const missing: string[] = [];

  forEachBody(copy, (body, lang) => {
    let removed = false;
    const replaced = body[lang].replace(PLACEHOLDER, (_whole, alt: string, name: string) => {
      const url = urls[name];
      if (url) return `![${alt}](${url})`;
      if (!missing.includes(name)) missing.push(name);
      removed = true;
      return "";
    });
    body[lang] = removed ? replaced.replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, "\n\n").trim() : replaced;
  });

  return { file: copy, missing };
}
