import { inflateRawSync } from "node:zlib";

/**
 * A small, dependency-free reader for .xlsx workbooks: it returns the cells of the FIRST sheet as text.
 * Enough for plain lists (names, numbers, dates typed as text); formulas are read as their last result,
 * styles, dates-as-serial-numbers and everything else are ignored.
 *
 * An .xlsx file is a zip archive of XML parts. The archive is read through its central directory and each part
 * is inflated with Node's zlib (the size of every part is capped, so a "zip bomb" cannot eat the memory).
 */

/** The file is not a readable .xlsx workbook. The message is meant for the person who uploaded it. */
export class XlsxError extends Error {}

const MAX_PART_BYTES = 30 * 1024 * 1024;
const MAX_ENTRIES = 2000;
const MAX_ROWS = 20000;
const MAX_COLUMNS = 200;

interface ZipEntry {
  method: number;
  compressedSize: number;
  uncompressedSize: number;
  localOffset: number;
}

function readEntries(buf: Buffer): Map<string, ZipEntry> {
  // End of central directory: 22 bytes (+ a comment of up to 64 KB), searched from the end of the file.
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 0xffff); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new XlsxError("Файл не похож на книгу Excel (.xlsx)");

  const total = buf.readUInt16LE(eocd + 10);
  const directorySize = buf.readUInt32LE(eocd + 12);
  const directoryOffset = buf.readUInt32LE(eocd + 16);
  if (total > MAX_ENTRIES || directoryOffset + directorySize > buf.length) throw new XlsxError("Файл Excel повреждён");

  const entries = new Map<string, ZipEntry>();
  let pos = directoryOffset;
  for (let n = 0; n < total; n++) {
    if (pos + 46 > buf.length || buf.readUInt32LE(pos) !== 0x02014b50) throw new XlsxError("Файл Excel повреждён");
    const flags = buf.readUInt16LE(pos + 8);
    const method = buf.readUInt16LE(pos + 10);
    const compressedSize = buf.readUInt32LE(pos + 20);
    const uncompressedSize = buf.readUInt32LE(pos + 24);
    const nameLength = buf.readUInt16LE(pos + 28);
    const extraLength = buf.readUInt16LE(pos + 30);
    const commentLength = buf.readUInt16LE(pos + 32);
    const localOffset = buf.readUInt32LE(pos + 42);
    if (flags & 1) throw new XlsxError("Файл Excel защищён паролем: снимите защиту и загрузите снова");
    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff || localOffset === 0xffffffff) {
      throw new XlsxError("Слишком большой файл Excel");
    }
    const name = buf.toString("utf8", pos + 46, pos + 46 + nameLength);
    entries.set(name, { method, compressedSize, uncompressedSize, localOffset });
    pos += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function extract(buf: Buffer, entry: ZipEntry): string {
  if (entry.uncompressedSize > MAX_PART_BYTES) throw new XlsxError("Слишком большой файл Excel");
  const p = entry.localOffset;
  if (p + 30 > buf.length || buf.readUInt32LE(p) !== 0x04034b50) throw new XlsxError("Файл Excel повреждён");
  const start = p + 30 + buf.readUInt16LE(p + 26) + buf.readUInt16LE(p + 28);
  const data = buf.subarray(start, start + entry.compressedSize);
  if (entry.method === 0) return data.toString("utf8");
  if (entry.method === 8) return inflateRawSync(data, { maxOutputLength: MAX_PART_BYTES }).toString("utf8");
  throw new XlsxError("Файл Excel сохранён неподдерживаемым способом сжатия");
}

const ENTITIES: Record<string, string> = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" };

function decodeXml(text: string): string {
  return text.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (whole, body: string) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isInteger(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    return ENTITIES[body] ?? whole;
  });
}

/** All the text of an element: its <t> runs joined (rich text is split into several runs). */
function textOf(xml: string): string {
  let out = "";
  for (const run of xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, "").matchAll(/<t\b[^>]*?(?:\/>|>([\s\S]*?)<\/t>)/g)) {
    out += decodeXml(run[1] ?? "");
  }
  return out;
}

function parseSharedStrings(xml: string): string[] {
  const strings: string[] = [];
  for (const item of xml.matchAll(/<si\b[^>]*?(?:\/>|>([\s\S]*?)<\/si>)/g)) strings.push(textOf(item[1] ?? ""));
  return strings;
}

/** "B12" -> 1 (the zero-based column). */
function columnOf(reference: string): number {
  let n = 0;
  for (const ch of reference) {
    const code = ch.charCodeAt(0);
    if (code >= 65 && code <= 90) n = n * 26 + (code - 64);
    else if (code >= 97 && code <= 122) n = n * 26 + (code - 96);
    else break;
  }
  return n - 1;
}

/** The part with the first sheet of the workbook, following workbook.xml and its relationships. */
function firstSheetPath(entries: Map<string, ZipEntry>, read: (name: string) => string | null): string {
  const workbook = read("xl/workbook.xml");
  const relations = read("xl/_rels/workbook.xml.rels");
  if (workbook && relations) {
    const id = /<sheet\b[^>]*?\br:id="([^"]+)"/.exec(workbook)?.[1];
    if (id) {
      for (const rel of relations.matchAll(/<Relationship\b([^>]*?)\/?>/g)) {
        const attrs = rel[1];
        if (new RegExp(`\\bId="${id}"`).test(attrs)) {
          const target = /\bTarget="([^"]+)"/.exec(attrs)?.[1];
          if (target) return target.startsWith("/") ? target.slice(1) : `xl/${target}`;
        }
      }
    }
  }
  const guess = [...entries.keys()].filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name)).sort();
  if (guess.length === 0) throw new XlsxError("В файле Excel нет листов");
  return guess[0];
}

/** The cells of the first sheet as rows of text. A row is as long as its last filled cell; empty trailing rows are dropped. */
export function readFirstSheet(file: Buffer): string[][] {
  try {
    const entries = readEntries(file);
    const read = (name: string): string | null => {
      const entry = entries.get(name);
      return entry ? extract(file, entry) : null;
    };

    const sheetPath = firstSheetPath(entries, read);
    const sheetXml = read(sheetPath);
    if (sheetXml === null) throw new XlsxError("Файл Excel повреждён: не найден лист");
    const shared = parseSharedStrings(read("xl/sharedStrings.xml") ?? "");

    const grid: string[][] = [];
    for (const rowMatch of sheetXml.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
      const body = rowMatch[2];
      if (!body) continue;
      const number = /\br="(\d+)"/.exec(rowMatch[1])?.[1];
      const rowIndex = number ? parseInt(number, 10) - 1 : grid.length;
      if (rowIndex < 0 || rowIndex >= MAX_ROWS) throw new XlsxError("В файле слишком много строк");

      const cells: string[] = [];
      let nextColumn = 0;
      for (const cell of body.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const attrs = cell[1];
        const inner = cell[2] ?? "";
        const reference = /\br="([A-Za-z]+)\d+"/.exec(attrs)?.[1];
        const column = reference ? columnOf(reference) : nextColumn;
        nextColumn = column + 1;
        if (column < 0 || column >= MAX_COLUMNS) continue;

        const type = /\bt="([^"]*)"/.exec(attrs)?.[1] ?? "n";
        let value = "";
        if (type === "inlineStr") {
          value = textOf(/<is\b[^>]*>([\s\S]*?)<\/is>/.exec(inner)?.[1] ?? "");
        } else {
          const raw = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(inner)?.[1];
          if (raw !== undefined) value = type === "s" ? (shared[parseInt(raw, 10)] ?? "") : decodeXml(raw);
        }
        cells[column] = value;
      }
      for (let i = 0; i < cells.length; i++) if (cells[i] === undefined) cells[i] = "";
      grid[rowIndex] = cells;
    }

    const rows: string[][] = [];
    for (let i = 0; i < grid.length; i++) rows.push(grid[i] ?? []);
    while (rows.length > 0 && rows[rows.length - 1].every((cell) => cell.trim() === "")) rows.pop();
    return rows;
  } catch (error) {
    if (error instanceof XlsxError) throw error;
    // RangeError of a truncated buffer, a zlib error of a broken part, ...
    throw new XlsxError("Не удалось прочитать файл Excel: он повреждён или сохранён не как .xlsx");
  }
}
