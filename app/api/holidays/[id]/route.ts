import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/rbac";
import { holidaySchema } from "@/lib/validations/holiday";
import { logAudit } from "@/lib/audit";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const data = holidaySchema.parse(body);
    const holiday = await prisma.holiday.update({ where: { id: params.id }, data });
    await logAudit({
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "Holiday",
      entityId: holiday.id,
      summary: `Изменён праздник «${holiday.title}»`,
    });
    return NextResponse.json(holiday);
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
    const holiday = await prisma.holiday.delete({ where: { id: params.id } });
    await logAudit({
      actorId: session.user.id,
      action: "DELETE",
      entityType: "Holiday",
      entityId: holiday.id,
      summary: `Удалён праздник «${holiday.title}»`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
