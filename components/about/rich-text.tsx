import type { ReactNode } from "react";

/**
 * Text of "О нас" in a small Markdown subset - what HR types in the admin and
 * what the Welcome Book needs:
 *   ## Подзаголовок      - список (также "* " и "• ")      1. нумерованный список
 *   > выноска            | таблица | со строкой |---| после шапки      **жирный**   [текст](ссылка)
 *   ![подпись](/uploads/фото.jpg)   - фото, загруженное в портал (кнопка «Вставить фото» в админке)
 * Everything is rendered as React elements (no raw HTML is ever inserted), a link
 * is only made clickable for http(s), mailto, tel or a path on this site, and a
 * photo is only shown when it comes from this portal's own uploads (nothing is
 * requested from outside: an internal page must not let anyone track its readers).
 *
 * Photos: a photo on a line of its own that opens the text goes to the right of the
 * text, like on the slides of the book; several photos on one line make a row;
 * a photo inside a table cell is a small portrait (a list of people).
 */

type Photo = { alt: string; src: string };

type Block =
  | { type: "heading"; text: string }
  | { type: "paragraph"; lines: string[] }
  | { type: "bullets"; items: string[] }
  | { type: "numbers"; items: string[] }
  | { type: "quote"; lines: string[] }
  | { type: "images"; items: Photo[] }
  | { type: "table"; header: string[] | null; rows: string[][] };

const BULLET = /^\s*(?:[-*•])\s+(.*)$/;
const NUMBER = /^\s*\d+[.)]\s+(.*)$/;
const TABLE_SEPARATOR = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;
const IMAGE = /!\[([^\]\n]*)\]\(([^)\s]+)\)/g;
const IMAGES_ONLY = /^(?:\s*!\[[^\]\n]*\]\([^)\s]+\))+\s*$/;

function splitCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

export function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i += 1;
      continue;
    }

    const heading = /^#{2,3}\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push({ type: "heading", text: heading[1].trim() });
      i += 1;
      continue;
    }

    if (BULLET.test(line)) {
      const items: string[] = [];
      while (i < lines.length && BULLET.test(lines[i])) {
        items.push(BULLET.exec(lines[i])![1].trim());
        i += 1;
      }
      blocks.push({ type: "bullets", items });
      continue;
    }

    if (NUMBER.test(line)) {
      const items: string[] = [];
      while (i < lines.length && NUMBER.test(lines[i])) {
        items.push(NUMBER.exec(lines[i])![1].trim());
        i += 1;
      }
      blocks.push({ type: "numbers", items });
      continue;
    }

    if (/^\s*>/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        quote.push(lines[i].replace(/^\s*>\s?/, ""));
        i += 1;
      }
      blocks.push({ type: "quote", lines: quote });
      continue;
    }

    if (/^\s*\|/.test(line)) {
      const tableLines: string[] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        tableLines.push(lines[i]);
        i += 1;
      }
      const hasHeader = tableLines.length > 1 && TABLE_SEPARATOR.test(tableLines[1]);
      const body = hasHeader ? tableLines.slice(2) : tableLines;
      blocks.push({
        type: "table",
        header: hasHeader ? splitCells(tableLines[0]) : null,
        rows: body.filter((row) => !TABLE_SEPARATOR.test(row)).map(splitCells),
      });
      continue;
    }

    const paragraph: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^#{2,3}\s/.test(lines[i]) &&
      !BULLET.test(lines[i]) &&
      !NUMBER.test(lines[i]) &&
      !/^\s*[>|]/.test(lines[i])
    ) {
      paragraph.push(lines[i].trim());
      i += 1;
    }

    const joined = paragraph.join(" ");
    if (IMAGES_ONLY.test(joined)) {
      blocks.push({ type: "images", items: [...joined.matchAll(IMAGE)].map((m) => ({ alt: m[1].trim(), src: m[2] })) });
    } else {
      blocks.push({ type: "paragraph", lines: paragraph });
    }
  }

  return blocks;
}

/** http(s), mailto, tel or a path on this site; anything else (javascript:, data:, ...) is not a link. */
export function safeHref(url: string): string | null {
  const href = url.trim();
  if (/^(https?:|mailto:|tel:)/i.test(href)) return href;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  return null;
}

/** Only a picture uploaded to this portal (/uploads/<name>.<image extension>); no other source is ever requested. */
export function safeImageSrc(url: string): string | null {
  const src = url.trim();
  return /^\/uploads\/[A-Za-z0-9._-]+\.(?:png|jpe?g|webp|gif)$/i.test(src) ? src : null;
}

function Picture({ src, alt, className }: { src: string; alt: string; className: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" decoding="async" className={className} />;
}

const INLINE = /(!\[[^\]\n]*\]\([^)\s]+\)|\*\*[^*\n]+\*\*|\[[^\]\n]+\]\([^)\s]+\))/g;

/** `inCell`: a photo in a table cell is a small portrait; elsewhere inside a line it is a small inline picture. */
function renderInline(text: string, inCell = false): ReactNode[] {
  return text.split(INLINE).map((part, index) => {
    const image = /^!\[([^\]\n]*)\]\(([^)\s]+)\)$/.exec(part);
    if (image) {
      const src = safeImageSrc(image[2]);
      if (!src) return null;
      return (
        <Picture
          key={index}
          src={src}
          alt={image[1]}
          className={inCell ? "h-20 w-16 rounded-md object-cover object-top" : "inline-block max-h-40 rounded-md align-middle"}
        />
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={index} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      const href = safeHref(link[2]);
      if (!href) return link[1];
      const external = /^https?:/i.test(href);
      return (
        <a
          key={index}
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="text-brand-700 underline hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
        >
          {link[1]}
        </a>
      );
    }
    return part;
  });
}

function renderLines(lines: string[]): ReactNode[] {
  return lines.flatMap((line, index) => (index === 0 ? [renderInline(line)] : [<br key={`br${index}`} />, renderInline(line)]));
}

function renderBlock(block: Block, index: number): ReactNode {
  switch (block.type) {
    case "heading":
      return (
        <h4 key={index} className="pt-1 text-sm font-semibold text-gray-900">
          {renderInline(block.text)}
        </h4>
      );
    case "paragraph":
      return <p key={index}>{renderLines(block.lines)}</p>;
    case "bullets":
      return (
        <ul key={index} className="list-disc space-y-1 pl-5 marker:text-brand-600">
          {block.items.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>
      );
    case "numbers":
      return (
        <ol key={index} className="list-decimal space-y-1 pl-5 marker:font-medium marker:text-brand-600">
          {block.items.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ol>
      );
    case "quote":
      return (
        <div
          key={index}
          className="rounded-md border-l-4 border-brand-600 bg-brand-50 px-3 py-2 text-brand-900 dark:bg-brand-950/40 dark:text-brand-100"
        >
          {renderLines(block.lines)}
        </div>
      );
    case "images": {
      const photos = block.items.flatMap((item) => {
        const src = safeImageSrc(item.src);
        return src ? [{ src, alt: item.alt }] : [];
      });
      if (photos.length === 0) return null;
      if (photos.length === 1) {
        return (
          <figure key={index} className="flex justify-center">
            <Picture src={photos[0].src} alt={photos[0].alt} className="max-h-80 w-auto max-w-full rounded-lg object-contain" />
          </figure>
        );
      }
      const columns = photos.length === 2 ? "grid-cols-2" : photos.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4";
      return (
        <div key={index} className={`grid gap-2 ${columns}`}>
          {photos.map((photo, i) => (
            <Picture key={i} src={photo.src} alt={photo.alt} className="aspect-[4/3] w-full rounded-lg object-cover" />
          ))}
        </div>
      );
    }
    case "table":
      return (
        <div key={index} className="overflow-x-auto rounded-md border border-gray-200">
          <table className="w-full text-left text-sm">
            {block.header && (
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  {block.header.map((cell, i) => (
                    <th key={i} className="border-b border-gray-200 px-3 py-2 font-medium">
                      {renderInline(cell, true)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {block.rows.map((row, r) => {
                // a row with a photo is centered (a portrait next to a name); other rows start at the top
                const align = row.some((cell) => cell.includes("![")) ? "align-middle" : "align-top";
                return (
                  <tr key={r} className="border-b border-gray-100 last:border-b-0">
                    {row.map((cell, c) => (
                      <td key={c} className={`px-3 py-2 ${align}`}>
                        {renderInline(cell, true)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
  }
}

export function RichText({ text, className = "" }: { text: string; className?: string }) {
  const blocks = parseBlocks(text);
  if (blocks.length === 0) return null;

  const textClass = `space-y-3 text-sm leading-relaxed text-gray-700 ${className}`;

  // A single photo that opens the text goes beside it (on a phone it stays above the text).
  const first = blocks[0];
  const lead = first.type === "images" && first.items.length === 1 ? safeImageSrc(first.items[0].src) : null;
  if (first.type === "images" && lead && blocks.length > 1) {
    return (
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_16rem]">
        <figure className="sm:col-start-2 sm:row-start-1">
          <Picture src={lead} alt={first.items[0].alt} className="max-h-[26rem] w-full rounded-lg object-cover object-top" />
        </figure>
        <div className={`${textClass} sm:col-start-1 sm:row-start-1`}>{blocks.slice(1).map((block, index) => renderBlock(block, index))}</div>
      </div>
    );
  }

  return <div className={textClass}>{blocks.map((block, index) => renderBlock(block, index))}</div>;
}
