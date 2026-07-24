import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHrOrAdmin, handleApiError } from "@/lib/rbac";
import { vacationSchema } from "@/lib/validations/org";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireHrOrAdmin();
    const body = await request.json();
    const data = vacationSchema.parse(body);

    const employee = await prisma.employee.update({
      where: { id: params.id },
      data,
    });

    await logAudit({
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "Employee",
      entityId: employee.id,
      summary: `Изменён отпуск сотрудника «${employee.fullName}»: ${data.vacationDaysUsed}/${data.vacationDaysTotal} дней`,
    });

    return NextResponse.json({
      ...employee,
      vacationDaysRemaining: employee.vacationDaysTotal - employee.vacationDaysUsed,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
