import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireHrOrAdmin, handleApiError, ApiError } from "@/lib/rbac";
import { parseCsv } from "@/lib/csv";
import { logAudit } from "@/lib/audit";

const REQUIRED_COLUMNS = ["fullname", "email", "position"];

const rowSchema = z.object({
  fullName: z.string().trim().min(2, "ФИО обязательно"),
  email: z.string().trim().email("Некорректный email"),
  position: z.string().trim().min(1, "Должность обязательна"),
  phone: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  birthDate: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? new Date(v) : undefined)),
  hireDate: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? new Date(v) : undefined)),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireHrOrAdmin();
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new ApiError(400, "Файл не найден в запросе");
    }

    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length < 2) {
      throw new ApiError(400, "Файл пуст или содержит только заголовок");
    }

    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const dataRows = rows.slice(1);

    for (const col of REQUIRED_COLUMNS) {
      if (!headers.includes(col)) {
        throw new ApiError(400, `Отсутствует обязательная колонка: ${col}`);
      }
    }
    const hasDepartmentPath = headers.includes("department_path");
    const hasDepartment = headers.includes("department");
    if (!hasDepartmentPath && !hasDepartment) {
      throw new ApiError(400, "Отсутствует обязательная колонка: department или department_path");
    }
    const colIndex = (name: string) => headers.indexOf(name);

    let createdCount = 0;
    let updatedCount = 0;
    const errors: { row: number; message: string }[] = [];

    const departmentCache = new Map<string, string>();
    const departmentPathCache = new Map<string, string>();
    const positionCache = new Map<string, string>();

    async function resolveDepartmentId(name: string): Promise<string> {
      const key = name.toLowerCase();
      const cached = departmentCache.get(key);
      if (cached) return cached;

      const existing = await prisma.department.findFirst({ where: { name } });
      const department = existing ?? (await prisma.department.create({ data: { name } }));
      departmentCache.set(key, department.id);
      return department.id;
    }

    /**
     * Resolves a ">"-joined department_path (e.g. "IT > Development > Backend"),
     * creating each level under its correct parent so the hierarchy matches the
     * path exactly. Mirrors getDepartmentPath()'s output format from the
     * employees export, so exporting then re-importing round-trips losslessly.
     */
    async function resolveDepartmentPath(path: string): Promise<string> {
      const segments = path
        .split(">")
        .map((s) => s.trim())
        .filter(Boolean);

      let parentId: string | null = null;
      let departmentId = "";

      for (const segment of segments) {
        const cacheKey = `${parentId ?? "root"}::${segment.toLowerCase()}`;
        const cached = departmentPathCache.get(cacheKey);
        let currentId: string;
        if (cached) {
          currentId = cached;
        } else {
          const existing = await prisma.department.findFirst({ where: { name: segment, parentId } });
          const department = existing ?? (await prisma.department.create({ data: { name: segment, parentId } }));
          currentId = department.id;
          departmentPathCache.set(cacheKey, currentId);
        }
        departmentId = currentId;
        parentId = currentId;
      }

      return departmentId;
    }

    async function resolvePositionId(title: string): Promise<string> {
      const key = title.toLowerCase();
      const cached = positionCache.get(key);
      if (cached) return cached;

      const position = await prisma.position.upsert({
        where: { title },
        update: {},
        create: { title },
      });
      positionCache.set(key, position.id);
      return position.id;
    }

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = i + 2; // +1 for header row, +1 for 1-indexing

      const raw = {
        fullName: row[colIndex("fullname")] ?? "",
        email: row[colIndex("email")] ?? "",
        position: row[colIndex("position")] ?? "",
        phone: colIndex("phone") >= 0 ? (row[colIndex("phone")] ?? "") : undefined,
        birthDate: colIndex("birthdate") >= 0 ? (row[colIndex("birthdate")] ?? "") : undefined,
        hireDate: colIndex("hiredate") >= 0 ? (row[colIndex("hiredate")] ?? "") : undefined,
      };

      const parsed = rowSchema.safeParse(raw);
      if (!parsed.success) {
        errors.push({
          row: rowNumber,
          message: parsed.error.issues[0]?.message ?? "Некорректная строка",
        });
        continue;
      }
      const data = parsed.data;

      const departmentValue = (
        hasDepartmentPath ? row[colIndex("department_path")] : row[colIndex("department")]
      )?.trim();
      if (!departmentValue) {
        errors.push({ row: rowNumber, message: "Отдел обязателен" });
        continue;
      }

      try {
        const [departmentId, positionId] = await Promise.all([
          hasDepartmentPath ? resolveDepartmentPath(departmentValue) : resolveDepartmentId(departmentValue),
          resolvePositionId(data.position),
        ]);

        const existingEmployee = await prisma.employee.findUnique({
          where: { email: data.email },
        });

        await prisma.employee.upsert({
          where: { email: data.email },
          update: {
            fullName: data.fullName,
            phone: data.phone,
            birthDate: data.birthDate,
            hireDate: data.hireDate,
            departmentId,
            positionId,
          },
          create: {
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            birthDate: data.birthDate,
            hireDate: data.hireDate,
            departmentId,
            positionId,
          },
        });

        if (existingEmployee) {
          updatedCount += 1;
        } else {
          createdCount += 1;
        }
      } catch {
        errors.push({ row: rowNumber, message: `Не удалось сохранить строку (email: ${data.email})` });
      }
    }

    await logAudit({
      actorId: session.user.id,
      action: "CREATE",
      entityType: "Employee",
      summary: `Импорт из CSV: создано ${createdCount}, обновлено ${updatedCount}, ошибок ${errors.length}`,
    });

    return NextResponse.json({ created: createdCount, updated: updatedCount, errors });
  } catch (error) {
    return handleApiError(error);
  }
}
