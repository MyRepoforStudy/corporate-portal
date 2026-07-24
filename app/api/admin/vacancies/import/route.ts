import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin, handleApiError, ApiError } from "@/lib/rbac";
import { parseCsv } from "@/lib/csv";
import { importVacanciesFromCsv } from "@/lib/vacancy-import";
import { logAudit } from "@/lib/audit";

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
    const result = await importVacanciesFromCsv(rows);

    await logAudit({
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "Vacancy",
      summary: `Импорт вакансий: создано отделов ${result.departmentsCreated}, вакансий ${result.vacanciesCreated}, ошибок ${result.errors.length}`,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
