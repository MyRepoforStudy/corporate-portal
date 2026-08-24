import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHrOrAdmin, handleApiError } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireHrOrAdmin();
    const vacation = await prisma.vacation.delete({
      where: { id: params.id },
      include: { employee: { select: { fullName: true } } },
    });
    await logAudit({
      actorId: session.user.id,
      action: "DELETE",
      entityType: "Vacation",
      entityId: vacation.id,
      summary: `Удалён отпуск сотрудника «${vacation.employee.fullName}»`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
