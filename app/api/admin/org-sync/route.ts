import { NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/rbac";
import { syncOrgStructureFromLdap } from "@/lib/ldap-sync";
import { logAudit } from "@/lib/audit";

export async function POST() {
  try {
    const session = await requireAdmin();
    const result = await syncOrgStructureFromLdap();

    await logAudit({
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "Employee",
      summary: `Синхронизация с AD: создано отделов ${result.departmentsCreated}, создано сотрудников ${result.employeesCreated}, обновлено ${result.employeesUpdated}, пропущено ${result.skipped.length}`,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
