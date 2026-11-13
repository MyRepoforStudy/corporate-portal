import { UNKNOWN_BIRTH_YEAR, birthDateOf } from "@/lib/birthdays";

// Birthdays from an HR list (last name, first name, day, month) -> Employee.birthDate.
// Pure and database-free, like lib/employee-import.ts, so the matching can be tested on its own.
// The file is read into a table of text by the route (xlsx or csv); this module does the rest.

/** The file as a whole cannot be used (no header, a column is missing, nothing to import). */
export class BirthdayFormatError extends Error {}

export interface BirthdayRow {
  /** Row number as Excel shows it: the header is row 1. */
  row: number;
  lastName: string;
  firstName: string;
  day: number;
  month: number;
}

export interface ParsedBirthdays {
  rows: BirthdayRow[];
  errors: { row: number; message: string }[];
}

const MAX_ROWS = 5000;

// Column names (lower case, letters and digits only). "Birthday" is the DAY of the month in the HR export.
const COLUMN_ALIASES = {
  lastName: ["lastname", "surname", "familyname", "фамилия"],
  firstName: ["firstname", "givenname", "name", "имя"],
  fullName: ["fullname", "фио", "фи"],
  day: ["birthday", "day", "birthdayday", "день", "деньрождения"],
  month: ["birthmonth", "month", "месяц", "месяцрождения"],
} as const;

type Column = keyof typeof COLUMN_ALIASES;

const headerKey = (cell: string) => cell.normalize("NFC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
const cleanName = (text: string) => text.normalize("NFC").replace(/\s+/g, " ").trim();

function isRealDate(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

const WHOLE_NUMBER = /^\s*(\d{1,2})(?:[.,]0+)?\s*$/;

/** The table of the file (first row = headers) -> rows with a valid day and month; the rest goes to `errors`. */
export function parseBirthdayTable(table: string[][]): ParsedBirthdays {
  if (table.length < 2) throw new BirthdayFormatError("Файл пуст или содержит только заголовок");

  const columns: Partial<Record<Column, number>> = {};
  table[0].forEach((cell, index) => {
    const key = headerKey(cell);
    for (const column of Object.keys(COLUMN_ALIASES) as Column[]) {
      if ((COLUMN_ALIASES[column] as readonly string[]).includes(key) && columns[column] === undefined) columns[column] = index;
    }
  });

  const hasNames = (columns.lastName !== undefined && columns.firstName !== undefined) || columns.fullName !== undefined;
  if (!hasNames || columns.day === undefined || columns.month === undefined) {
    throw new BirthdayFormatError(
      "В первой строке не найдены нужные колонки. Нужны: Lastname (фамилия), FirstName (имя), " +
        "Birthday (день месяца) и BirthMonth (номер месяца). Найдено: " +
        (table[0].map((c) => c.trim()).filter(Boolean).join(", ") || "ничего")
    );
  }

  const rows: BirthdayRow[] = [];
  const errors: { row: number; message: string }[] = [];
  const text = (row: string[], index: number | undefined) => (index === undefined ? "" : (row[index] ?? ""));

  for (let i = 1; i < table.length; i++) {
    const raw = table[i];
    if (raw.every((cell) => cell.trim() === "")) continue;
    const rowNumber = i + 1;
    if (rows.length + errors.length >= MAX_ROWS) throw new BirthdayFormatError(`В файле больше ${MAX_ROWS} строк`);

    let lastName = cleanName(text(raw, columns.lastName));
    let firstName = cleanName(text(raw, columns.firstName));
    if (columns.lastName === undefined || columns.firstName === undefined) {
      // a single "ФИО" column: the first word is the last name, the rest is the first name (and the patronymic)
      const [first, ...rest] = cleanName(text(raw, columns.fullName)).split(" ");
      lastName = first ?? "";
      firstName = rest.join(" ");
    }
    if (!lastName || !firstName) {
      errors.push({ row: rowNumber, message: "Не указана фамилия или имя" });
      continue;
    }

    const day = WHOLE_NUMBER.exec(text(raw, columns.day));
    if (!day) {
      errors.push({ row: rowNumber, message: `${lastName} ${firstName}: день рождения должен быть числом от 1 до 31` });
      continue;
    }
    const month = WHOLE_NUMBER.exec(text(raw, columns.month));
    if (!month) {
      errors.push({ row: rowNumber, message: `${lastName} ${firstName}: месяц должен быть числом от 1 до 12` });
      continue;
    }
    const d = Number(day[1]);
    const m = Number(month[1]);
    // the year is unknown, so 29 February is allowed (a leap year is used for the check)
    if (m < 1 || m > 12 || d < 1 || !isRealDate(UNKNOWN_BIRTH_YEAR, m, d)) {
      errors.push({ row: rowNumber, message: `${lastName} ${firstName}: такой даты не бывает (${d}.${m})` });
      continue;
    }
    rows.push({ row: rowNumber, lastName, firstName, day: d, month: m });
  }

  if (rows.length === 0 && errors.length === 0) throw new BirthdayFormatError("В файле нет строк с данными");
  return { rows, errors };
}

// --- matching names ----------------------------------------------------------------

/** Lower case, "ё" = "е", letters and digits only: spaces, hyphens, dots and the order of writing do not matter. */
export function normalizeName(text: string): string {
  return Array.from(text.normalize("NFC").toLowerCase().replace(/ё/g, "е"))
    .filter((ch) => /[\p{L}\p{N}]/u.test(ch))
    .join("");
}

// Kazakh letters and a few spelling variants as Russian ones: "Қасым" = "Касым", "Айгүл" = "Айгул".
const FOLD: Record<string, string> = {
  ә: "а",
  ғ: "г",
  қ: "к",
  ң: "н",
  ө: "о",
  ұ: "у",
  ү: "у",
  һ: "х",
  і: "и",
  й: "и",
  ъ: "",
  ь: "",
};

export function foldName(text: string): string {
  return Array.from(normalizeName(text))
    .map((ch) => FOLD[ch] ?? ch)
    .join("");
}

/** Edit distance of two short strings. */
function distance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current.push(Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)));
    }
    previous = current;
  }
  return previous[b.length];
}

export interface PersonRef {
  id: string;
  /** "Фамилия Имя Отчество", "Фамилия Имя" or a name written in more words (Korean names: "Пак Сун Ми"). */
  fullName: string;
  birthDate: Date | null;
}

export interface BirthdayWrite {
  personId: string;
  personName: string;
  birthDate: Date;
}

const dayMonth = (day: number, month: number) => `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}`;

export interface BirthdayReport {
  /** Rows with data in the file (the invalid ones included). */
  rowsInFile: number;
  /** How many birthdays this import writes. */
  toWrite: number;
  /** Matched people who already have the same day and month. */
  unchanged: number;
  /** Matched people who already have ANOTHER day or month: written only when the old date may be replaced. */
  differs: { name: string; current: string; inFile: string; rows: number[] }[];
  /** Matched only after treating Kazakh and Russian letters alike: accepted, but worth a look. */
  approximate: { row: number; inFile: string; inPortal: string }[];
  /** The same person listed again with the same date: ignored. */
  duplicates: { row: number; ofRow: number; name: string }[];
  /** The same person listed with different dates: nothing is written for them. */
  conflicts: { name: string; rows: { row: number; value: string }[] }[];
  /** Several people of the portal fit one row: nothing is written. */
  ambiguous: { row: number; name: string; candidates: string[] }[];
  /** Nobody of the portal fits the row; `suggestions` are similar names (never applied by themselves). */
  notFound: { row: number; name: string; value: string; suggestions: string[] }[];
  invalid: { row: number; message: string }[];
  /** People of the portal that have no birthday after this import. */
  withoutBirthday: number;
}

/**
 * Matches the rows to the people of the portal by last name + first name and decides what to write.
 * A person's name in the portal is "last first patronymic": the first two (or more) words are compared with the
 * row, so the patronymic does not matter. Only exact matches (ignoring case, "ё", spaces and hyphens) and matches
 * that differ in Kazakh/Russian letters only are accepted - everything else is reported, never guessed.
 * With `overwrite` a different date that a person already has is replaced (the real year, if it is known, stays).
 */
export function planBirthdayImport(
  parsed: ParsedBirthdays,
  people: PersonRef[],
  options: { overwrite?: boolean } = {}
): { report: BirthdayReport; writes: BirthdayWrite[] } {
  const exactIndex = new Map<string, Set<number>>();
  const foldedIndex = new Map<string, Set<number>>();
  const foldedKeys: string[][] = [];
  people.forEach((person, index) => {
    const words = person.fullName.normalize("NFC").split(/\s+/).filter(Boolean);
    const keys: string[] = [];
    for (let count = 2; count <= words.length; count++) {
      const joined = words.slice(0, count).join("");
      const exact = normalizeName(joined);
      const folded = foldName(joined);
      keys.push(folded);
      if (exact) (exactIndex.get(exact) ?? exactIndex.set(exact, new Set()).get(exact)!).add(index);
      if (folded) (foldedIndex.get(folded) ?? foldedIndex.set(folded, new Set()).get(folded)!).add(index);
    }
    foldedKeys.push(keys);
  });

  const report: BirthdayReport = {
    rowsInFile: parsed.rows.length + parsed.errors.length,
    toWrite: 0,
    unchanged: 0,
    differs: [],
    approximate: [],
    duplicates: [],
    conflicts: [],
    ambiguous: [],
    notFound: [],
    invalid: [...parsed.errors],
    withoutBirthday: 0,
  };

  // person index -> the rows that point at them
  const rowsOf = new Map<number, { row: BirthdayRow; spelling: boolean }[]>();

  for (const row of parsed.rows) {
    const name = `${row.lastName} ${row.firstName}`;
    const exact = exactIndex.get(normalizeName(name));
    const folded = exact && exact.size > 0 ? undefined : foldedIndex.get(foldName(name));
    const hits = [...(exact && exact.size > 0 ? exact : (folded ?? []))];

    if (hits.length === 0) {
      const key = foldName(name);
      const limit = key.length < 12 ? 1 : 2;
      const near = people
        .map((person, index) => ({ person, best: Math.min(...foldedKeys[index].map((k) => distance(key, k)), Infinity) }))
        .filter((item) => item.best <= limit)
        .sort((a, b) => a.best - b.best)
        .slice(0, 3)
        .map((item) => item.person.fullName);
      report.notFound.push({ row: row.row, name, value: dayMonth(row.day, row.month), suggestions: near });
    } else if (hits.length > 1) {
      report.ambiguous.push({ row: row.row, name, candidates: hits.map((i) => people[i].fullName) });
    } else {
      const list = rowsOf.get(hits[0]) ?? [];
      list.push({ row, spelling: !(exact && exact.size > 0) });
      rowsOf.set(hits[0], list);
    }
  }

  const writes: BirthdayWrite[] = [];
  const written = new Set<string>();

  for (const [index, list] of rowsOf) {
    const person = people[index];
    const first = list[0].row;
    const same = list.filter((item) => item.row.day === first.day && item.row.month === first.month);

    if (same.length !== list.length) {
      report.conflicts.push({
        name: person.fullName,
        rows: list.map((item) => ({ row: item.row.row, value: dayMonth(item.row.day, item.row.month) })),
      });
      continue;
    }
    for (const extra of list.slice(1)) {
      report.duplicates.push({ row: extra.row.row, ofRow: first.row, name: person.fullName });
    }
    if (list[0].spelling) {
      report.approximate.push({
        row: first.row,
        inFile: `${first.lastName} ${first.firstName}`,
        inPortal: person.fullName,
      });
    }

    const current = person.birthDate;
    if (current) {
      const currentDay = current.getUTCDate();
      const currentMonth = current.getUTCMonth() + 1;
      if (currentDay === first.day && currentMonth === first.month) {
        report.unchanged += 1;
        continue;
      }
      report.differs.push({
        name: person.fullName,
        current: dayMonth(currentDay, currentMonth),
        inFile: dayMonth(first.day, first.month),
        rows: list.map((item) => item.row.row),
      });
      if (!options.overwrite) continue;
      // keep the real year of the old date when there is one (and the new day exists in that year)
      const year = current.getUTCFullYear();
      const keepYear = year !== UNKNOWN_BIRTH_YEAR && isRealDate(year, first.month, first.day) ? year : UNKNOWN_BIRTH_YEAR;
      writes.push({ personId: person.id, personName: person.fullName, birthDate: birthDateOf(first.day, first.month, keepYear) });
      written.add(person.id);
      continue;
    }

    writes.push({ personId: person.id, personName: person.fullName, birthDate: birthDateOf(first.day, first.month) });
    written.add(person.id);
  }

  report.toWrite = writes.length;
  report.withoutBirthday = people.filter((person) => !person.birthDate && !written.has(person.id)).length;
  const byRow = <T extends { row: number }>(a: T, b: T) => a.row - b.row;
  report.notFound.sort(byRow);
  report.ambiguous.sort(byRow);
  report.approximate.sort(byRow);
  report.duplicates.sort(byRow);
  report.invalid.sort(byRow);
  return { report, writes };
}
