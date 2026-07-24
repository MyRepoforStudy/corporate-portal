import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHrOrAdmin, requireSession, handleApiError, ApiError } from "@/lib/rbac";
import { workplaceSchema } from "@/lib/validations/workplace";
import { logAudit } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    await requireSession();
    const workplace = await prisma.workplace.findUnique({
      where: { employeeId: params.employeeId },
      include: { employee: { include: { department: true, position: true } } },
    });

    if (!workplace) {
      throw new ApiError(404, "Рабочее место не найдено");
    }

    return NextResponse.json(workplace);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    const session = await requireHrOrAdmin();
    const body = await request.json();
    const data = workplaceSchema.parse(body);
    const workplace = await prisma.workplace.upsert({
      where: { employeeId: params.employeeId },
      update: data,
      create: { employeeId: params.employeeId, ...data },
      include: { employee: true },
    });
    await logAudit({
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "Workplace",
      entityId: workplace.id,
      summary: `Обновлено рабочее место сотрудника «${workplace.employee.fullName}»`,
    });
    return NextResponse.json(workplace);
  } catch (error) {
    return handleApiError(error);
  }
}
