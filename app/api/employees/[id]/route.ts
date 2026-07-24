import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireHrOrAdmin, requireSession, handleApiError, ApiError } from "@/lib/rbac";
import { employeeSchema } from "@/lib/validations/org";
import { logAudit } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireSession();
    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
      include: { department: true, position: true, workplace: true },
    });
    if (!employee) {
      throw new ApiError(404, "Сотрудник не найден");
    }
    return NextResponse.json({
      ...employee,
      vacationDaysRemaining: employee.vacationDaysTotal - employee.vacationDaysUsed,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// Widened from Admin-only to HR-or-Admin: HR manages employee profile data
// (name, department, position) per the permission matrix. Vacation fields go
// through the dedicated /vacation sub-route instead of this one.
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireHrOrAdmin();
    const body = await request.json();
    const data = employeeSchema.parse(body);
    const employee = await prisma.employee.update({
      where: { id: params.id },
      data,
      include: { department: true, position: true },
    });
    await logAudit({
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "Employee",
      entityId: employee.id,
      summary: `Изменён сотрудник «${employee.fullName}»`,
    });
    return NextResponse.json(employee);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();
    const employee = await prisma.employee.delete({ where: { id: params.id } });
    await logAudit({
      actorId: session.user.id,
      action: "DELETE",
      entityType: "Employee",
      entityId: employee.id,
      summary: `Удалён сотрудник «${employee.fullName}»`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
