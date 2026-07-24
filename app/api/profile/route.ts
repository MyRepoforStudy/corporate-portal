import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/rbac";
import { profileSchema } from "@/lib/validations/profile";
import { logAudit } from "@/lib/audit";

async function loadProfile(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      employee: {
        include: { department: true, position: true, workplace: true },
      },
    },
  });

  const { employee, ...account } = user;
  return {
    account: {
      id: account.id,
      displayName: account.displayName,
      email: account.email,
      ldapUid: account.ldapUid,
      role: account.role,
      canBookRooms: account.canBookRooms,
    },
    employee: employee
      ? {
          ...employee,
          vacationDaysRemaining: employee.vacationDaysTotal - employee.vacationDaysUsed,
        }
      : null,
  };
}

export async function GET() {
  try {
    const session = await requireSession();
    return NextResponse.json(await loadProfile(session.user.id));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const data = profileSchema.parse(body);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
    if (!user.employeeId) {
      throw new ApiError(
        409,
        "Профиль не привязан к записи сотрудника. Обратитесь в HR."
      );
    }

    const employee = await prisma.employee.update({
      where: { id: user.employeeId },
      data,
      include: { department: true, position: true, workplace: true },
    });

    await logAudit({
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "Employee",
      entityId: employee.id,
      summary: "Сотрудник обновил свой профиль",
    });

    return NextResponse.json(await loadProfile(session.user.id));
  } catch (error) {
    return handleApiError(error);
  }
}
