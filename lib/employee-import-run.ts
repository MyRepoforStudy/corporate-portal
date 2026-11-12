import { prisma } from "@/lib/prisma";
import type { ParsedEmployeeImport } from "@/lib/employee-import";
import {
  createDepartmentCache,
  createPositionCache,
  resolveDepartmentByName,
  resolveDepartmentPath,
  resolvePositionId,
} from "@/lib/org-resolve";

export interface ImportOutcome {
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
  departmentsCreated: number;
  positionsCreated: number;
}

/**
 * Writes the rows of a parsed employees CSV to the database: creates missing
 * departments/positions, then creates or updates each employee. A row that
 * fails is reported in `errors` and does not stop the rest.
 */
export async function saveEmployeeImport(parsed: ParsedEmployeeImport): Promise<ImportOutcome> {
  const errors = [...parsed.errors];
  const departments = createDepartmentCache();
  const positions = createPositionCache();
  let created = 0;
  let updated = 0;

  for (const row of parsed.rows) {
    // ">"-separated hierarchy, e.g. "IT > Development > Backend": every level
    // is created under its own parent, so the tree matches the path exactly
    // (same format as the employees export, so export -> import round-trips).
    const segments = row.department
      .split(">")
      .map((s) => s.trim())
      .filter(Boolean);
    if (segments.length === 0) {
      errors.push({ row: row.row, message: "Отдел обязателен" });
      continue;
    }

    try {
      const departmentId = parsed.usesDepartmentPath
        ? await resolveDepartmentPath(segments, departments)
        : await resolveDepartmentByName(row.department, departments);
      const positionId = await resolvePositionId(row.position, positions, row.positionRank);

      // Optional columns that are empty come through as undefined, which Prisma
      // treats as "leave unchanged" - re-importing a file never wipes data the
      // file doesn't carry (phone, birth date, ...).
      const data = {
        fullName: row.fullName,
        phone: row.phone,
        birthDate: row.birthDate,
        hireDate: row.hireDate,
        location: row.location,
        departmentId,
        positionId,
      };

      // E-mail is the identity, compared ignoring case: Kim.A@x and kim.a@x are
      // the same mailbox, but the unique index alone would treat them as two
      // different employees.
      const existing = await prisma.employee.findFirst({
        where: { email: { equals: row.email, mode: "insensitive" } },
        select: { id: true },
      });
      if (existing) {
        await prisma.employee.update({ where: { id: existing.id }, data });
        updated += 1;
      } else {
        await prisma.employee.create({ data: { ...data, email: row.email } });
        created += 1;
      }
    } catch {
      errors.push({ row: row.row, message: `Не удалось сохранить строку (email: ${row.email})` });
    }
  }

  return {
    created,
    updated,
    errors,
    departmentsCreated: departments.created,
    positionsCreated: positions.created,
  };
}
