import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHrOrAdmin, handleApiError, ApiError } from "@/lib/rbac";
import { vacationEntrySchema } from "@/lib/validations/calendar";
import { logAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const session = await requireHrOrAdmin();
    const body = await request.json();
    const data = vacationEntrySchema.parse(body);

    const employee = await prisma.employee.findUnique({ where: { id: data.employeeId } });
    if (!employee) {
      throw new ApiError(404, "Сотрудник не найден");
    }

    const vacation = await prisma.vacation.create({
      data,
      include: { employee: { select: { id: true, fullName: true, photoUrl: true } } },
    });
    await logAudit({
      actorId: session.user.id,
      action: "CREATE",
      entityType: "Vacation",
      entityId: vacation.id,
      summary: `Добавлен отпуск сотрудника «${employee.fullName}»`,
    });
    return NextResponse.json(vacation, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
