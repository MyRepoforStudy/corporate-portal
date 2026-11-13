/**
 * The delimiter of a CSV text: the one of "," ";" and a tab that the first non-empty line has most of (outside
 * quotes). Excel with Russian regional settings saves "CSV" with semicolons, other tools use commas.
 */
export function detectDelimiter(input: string): "," | ";" | "\t" {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const counts = { ",": 0, ";": 0, "\t": 0 };
  let inQuotes = false;
  for (const char of text) {
    if (char === '"') inQuotes = !inQuotes;
    else if (!inQuotes && (char === "\n" || char === "\r")) {
      if (counts[","] + counts[";"] + counts["\t"] > 0) break;
    } else if (!inQuotes && char in counts) counts[char as keyof typeof counts] += 1;
  }
  if (counts[";"] > counts[","] && counts[";"] >= counts["\t"]) return ";";
  if (counts["\t"] > counts[","] && counts["\t"] > counts[";"]) return "\t";
  return ",";
}

/** Minimal RFC4180-ish CSV parser: handles quoted fields, escaped quotes, CRLF/LF. */
export function parseCsv(input: string, delimiter: string = ","): string[][] {
  // Strip a leading UTF-8 BOM - Excel adds one when saving "CSV UTF-8", and
  // without stripping it the first header cell silently fails to match
  // (e.g. "﻿department_path" !== "department_path").
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && next === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.length > 1 || r[0]?.trim() !== "");
}

/** Serializes rows to RFC4180-ish CSV text, with a UTF-8 BOM so Excel opens Cyrillic correctly. */
export function toCsv(rows: (string | number | null | undefined)[][]): string {
  const escape = (value: string | number | null | undefined) => {
    const s = value == null ? "" : String(value);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + rows.map((row) => row.map(escape).join(",")).join("\r\n");
}
