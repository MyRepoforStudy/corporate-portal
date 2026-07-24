import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/rbac";
import {
  createDepartmentCache,
  createPositionCache,
  resolveDepartmentPath,
  resolvePositionId,
} from "@/lib/org-resolve";

export interface VacancyImportResult {
  departmentsCreated: number;
  vacanciesCreated: number;
  errors: { row: number; message: string }[];
}

// CSV columns: department_path (hierarchy segments separated by ">"),
// position, note (optional). Each import fully replaces the vacancy list -
// a vacancy has no stable key in the source staffing sheet, so "current
// vacancies = whatever was in the latest uploaded file" is the only sane
// semantics for repeat uploads.
export async function importVacanciesFromCsv(rows: string[][]): Promise<VacancyImportResult> {
  if (rows.length < 2) {
    throw new ApiError(400, "Файл пуст или содержит только заголовок");
  }

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const pathIdx = headers.indexOf("department_path");
  const positionIdx = headers.indexOf("position");
  const noteIdx = headers.indexOf("note");

  if (pathIdx === -1 || positionIdx === -1) {
    throw new ApiError(400, "Файл должен содержать колонки department_path и position");
  }

  const result: VacancyImportResult = { departmentsCreated: 0, vacanciesCreated: 0, errors: [] };
  const departmentCache = createDepartmentCache();
  const positionCache = createPositionCache();
  const dataRows = rows.slice(1);

  const toCreate: { departmentId: string; positionId: string; note: string | null }[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNumber = i + 2;
    const pathRaw = row[pathIdx]?.trim();
    const positionTitle = row[positionIdx]?.trim();
    const note = noteIdx >= 0 ? row[noteIdx]?.trim() || null : null;

    if (!pathRaw || !positionTitle) {
      result.errors.push({ row: rowNumber, message: "Пустой путь отдела или должность" });
      continue;
    }

    const pathSegments = pathRaw
      .split(">")
      .map((s) => s.trim())
      .filter(Boolean);
    if (pathSegments.length === 0) {
      result.errors.push({ row: rowNumber, message: "Некорректный путь отдела" });
      continue;
    }

    try {
      const departmentId = await resolveDepartmentPath(pathSegments, departmentCache);
      const positionId = await resolvePositionId(positionTitle, positionCache);
      toCreate.push({ departmentId, positionId, note });
    } catch {
      result.errors.push({ row: rowNumber, message: "Не удалось обработать строку" });
    }
  }

  await prisma.vacancy.deleteMany({});
  if (toCreate.length > 0) {
    await prisma.vacancy.createMany({ data: toCreate });
  }
  result.departmentsCreated = departmentCache.created;
  result.vacanciesCreated = toCreate.length;

  return result;
}
