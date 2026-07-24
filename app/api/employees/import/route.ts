import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleApiError, ApiError } from "@/lib/rbac";
import { parseCsv } from "@/lib/csv";
import { logAudit } from "@/lib/audit";

const REQUIRED_COLUMNS = ["fullname", "email", "department", "position"];

const rowSchema = z.object({
  fullName: z.string().trim().min(2, "ФИО обязательно"),
  email: z.string().trim().email("Некорректный email"),
  department: z.string().trim().min(1, "Отдел обязателен"),
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
    const session = await requireAdmin();
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
    const colIndex = (name: string) => headers.indexOf(name);

    let createdCount = 0;
    let updatedCount = 0;
    const errors: { row: number; message: string }[] = [];

    const departmentCache = new Map<string, string>();
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
        department: row[colIndex("department")] ?? "",
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

      try {
        const [departmentId, positionId] = await Promise.all([
          resolveDepartmentId(data.department),
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
