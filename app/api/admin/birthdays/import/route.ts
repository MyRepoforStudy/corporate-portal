import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHrOrAdmin, handleApiError, ApiError } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { BirthdayFormatError, parseBirthdayTable, planBirthdayImport, type ParsedBirthdays } from "@/lib/birthday-import";
import { readBirthdayTable } from "@/lib/birthday-file";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

// Birthdays from an HR list (xlsx or csv: last name, first name, day, month) -> Employee.birthDate.
// Without `apply` it only reports what would happen (the "check" button); with `apply=1` it writes.
// People are matched by name (lib/birthday-import.ts); a date that a person already has is only
// replaced with `overwrite=1`.
export async function POST(request: NextRequest) {
  try {
    const session = await requireHrOrAdmin();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError(400, "Файл не найден в запросе");
    if (file.size > MAX_FILE_BYTES) throw new ApiError(400, "Файл больше 5 МБ");
    const apply = form.get("apply") === "1";
    const overwrite = form.get("overwrite") === "1";

    let parsed: ParsedBirthdays;
    try {
      parsed = parseBirthdayTable(await readBirthdayTable(file));
    } catch (error) {
      if (error instanceof BirthdayFormatError) throw new ApiError(400, error.message);
      throw error;
    }

    const people = await prisma.employee.findMany({ select: { id: true, fullName: true, birthDate: true } });
    const { report, writes } = planBirthdayImport(parsed, people, { overwrite });

    if (apply && writes.length > 0) {
      await prisma.$transaction(
        writes.map((write) => prisma.employee.update({ where: { id: write.personId }, data: { birthDate: write.birthDate } }))
      );
      await logAudit({
        actorId: session.user.id,
        action: "UPDATE",
        entityType: "Employee",
        summary:
          `Импорт дней рождения: записано ${writes.length}; не найдено ${report.notFound.length}, ` +
          `неоднозначно ${report.ambiguous.length}, с другой датой ${report.differs.length}` +
          (overwrite ? " (старые даты заменены)" : ""),
      });
    }

    return NextResponse.json({ applied: apply, written: apply ? writes.length : 0, report });
  } catch (error) {
    return handleApiError(error);
  }
}
