import { detectDelimiter, parseCsv } from "@/lib/csv";
import { readFirstSheet, XlsxError } from "@/lib/xlsx-read";
import { BirthdayFormatError } from "@/lib/birthday-import";

/**
 * An uploaded list of birthdays -> a table of text (first row = headers).
 * .xlsx (the first sheet) and CSV are accepted; a CSV may use commas, semicolons or tabs, and UTF-8 or the
 * Windows-1251 of older Excel versions. Server side only (Buffer, zlib).
 */
export async function readBirthdayTable(file: File): Promise<string[][]> {
  const bytes = Buffer.from(await file.arrayBuffer());

  // "PK\x03\x04": a zip archive, i.e. an .xlsx workbook
  if (bytes.length >= 4 && bytes.readUInt32LE(0) === 0x04034b50) {
    try {
      return readFirstSheet(bytes);
    } catch (error) {
      if (error instanceof XlsxError) throw new BirthdayFormatError(error.message);
      throw error;
    }
  }
  // the OLE2 header of an old binary .xls
  if (bytes.length >= 4 && bytes.readUInt32BE(0) === 0xd0cf11e0) {
    throw new BirthdayFormatError("Старый формат .xls не поддерживается: сохраните файл как .xlsx или CSV");
  }

  let text = bytes.toString("utf8");
  if (text.includes("�")) text = new TextDecoder("windows-1251").decode(bytes);
  return parseCsv(text, detectDelimiter(text));
}
