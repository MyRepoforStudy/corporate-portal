import { NextResponse, type NextRequest } from "next/server";
import { requireHrOrAdmin, handleApiError, ApiError } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { ImportFormatError, parseEmployeeImport, type ParsedEmployeeImport } from "@/lib/employee-import";
import { saveEmployeeImport } from "@/lib/employee-import-run";

export async function POST(request: NextRequest) {
  try {
    const session = await requireHrOrAdmin();
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new ApiError(400, "Файл не найден в запросе");
    }

    let parsed: ParsedEmployeeImport;
    try {
      parsed = parseEmployeeImport(await file.text());
    } catch (error) {
      if (error instanceof ImportFormatError) throw new ApiError(400, error.message);
      throw error;
    }

    const outcome = await saveEmployeeImport(parsed);

    await logAudit({
      actorId: session.user.id,
      action: "CREATE",
      entityType: "Employee",
      summary:
        `Импорт из CSV: создано ${outcome.created}, обновлено ${outcome.updated}, ошибок ${outcome.errors.length}; ` +
        `новых отделов ${outcome.departmentsCreated}, должностей ${outcome.positionsCreated}`,
    });

    return NextResponse.json(outcome);
  } catch (error) {
    return handleApiError(error);
  }
}
