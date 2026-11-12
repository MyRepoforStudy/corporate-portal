import { z } from "zod";
import { parseCsv } from "@/lib/csv";

// Pure (database-free) parsing and validation of the employees CSV, kept apart
// from the API route so it can be tested on its own. The accepted columns are
// described in components/admin/import-admin.tsx.

/** Problems with the file as a whole (empty, missing column). Row-level problems go to `errors`. */
export class ImportFormatError extends Error {}

export interface ImportRow {
  /** Row number as Excel shows it: the header is row 1. */
  row: number;
  fullName: string;
  email: string;
  position: string;
  /** Seniority (0-1000). Only set when the file has a position_rank column. */
  positionRank?: number;
  /** Raw `department_path` (">"-separated hierarchy) or `department` (a single name). */
  department: string;
  phone?: string;
  birthDate?: Date;
  hireDate?: Date;
  location?: string;
}

export interface ParsedEmployeeImport {
  rows: ImportRow[];
  errors: { row: number; message: string }[];
  /** True when the file has the full hierarchy column instead of one department name. */
  usesDepartmentPath: boolean;
}

const REQUIRED_COLUMNS = ["fullname", "email", "position"];

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

const optionalDate = optionalText
  .refine((v) => v === undefined || !Number.isNaN(new Date(v).getTime()), "Некорректная дата (нужен формат ГГГГ-ММ-ДД)")
  .transform((v) => (v === undefined ? undefined : new Date(v)));

const optionalRank = optionalText
  .refine((v) => v === undefined || (/^[0-9]{1,4}$/.test(v) && Number(v) <= 1000), "position_rank: целое число от 0 до 1000")
  .transform((v) => (v === undefined ? undefined : Number(v)));

const rowSchema = z.object({
  fullName: z.string().trim().min(2, "ФИО обязательно"),
  email: z.string().trim().email("Некорректный email"),
  position: z.string().trim().min(1, "Должность обязательна"),
  positionRank: optionalRank,
  phone: optionalText,
  birthDate: optionalDate,
  hireDate: optionalDate,
  location: optionalText.refine((v) => v === undefined || v.length <= 200, "Локация длиннее 200 символов"),
});

export function parseEmployeeImport(csvText: string): ParsedEmployeeImport {
  const table = parseCsv(csvText);
  if (table.length < 2) throw new ImportFormatError("Файл пуст или содержит только заголовок");

  const headers = table[0].map((h) => h.trim().toLowerCase());
  for (const name of REQUIRED_COLUMNS) {
    if (!headers.includes(name)) throw new ImportFormatError(`Отсутствует обязательная колонка: ${name}`);
  }
  const usesDepartmentPath = headers.includes("department_path");
  if (!usesDepartmentPath && !headers.includes("department")) {
    throw new ImportFormatError("Отсутствует обязательная колонка: department или department_path");
  }

  /** A cell by column name; undefined when the file has no such column. */
  const cell = (row: string[], name: string): string | undefined => {
    const index = headers.indexOf(name);
    return index >= 0 ? (row[index] ?? "") : undefined;
  };
  const departmentColumn = usesDepartmentPath ? "department_path" : "department";

  const rows: ImportRow[] = [];
  const errors: { row: number; message: string }[] = [];
  // The same e-mail twice means two people share an address (or one person is
  // listed twice). Importing both would silently overwrite the first with the
  // second, so the repeat is reported and skipped instead.
  const firstRowByEmail = new Map<string, number>();

  table.slice(1).forEach((raw, i) => {
    const rowNumber = i + 2;
    const parsed = rowSchema.safeParse({
      fullName: cell(raw, "fullname") ?? "",
      email: cell(raw, "email") ?? "",
      position: cell(raw, "position") ?? "",
      positionRank: cell(raw, "position_rank"),
      phone: cell(raw, "phone"),
      birthDate: cell(raw, "birthdate"),
      hireDate: cell(raw, "hiredate"),
      location: cell(raw, "location"),
    });
    if (!parsed.success) {
      errors.push({ row: rowNumber, message: parsed.error.issues[0]?.message ?? "Некорректная строка" });
      return;
    }

    const department = (cell(raw, departmentColumn) ?? "").trim();
    if (!department) {
      errors.push({ row: rowNumber, message: "Отдел обязателен" });
      return;
    }

    const emailKey = parsed.data.email.toLowerCase();
    const firstRow = firstRowByEmail.get(emailKey);
    if (firstRow !== undefined) {
      errors.push({
        row: rowNumber,
        message: `Email ${parsed.data.email} уже есть в строке ${firstRow}: строка пропущена`,
      });
      return;
    }
    firstRowByEmail.set(emailKey, rowNumber);

    rows.push({ row: rowNumber, department, ...parsed.data });
  });

  return { rows, errors, usesDepartmentPath };
}
