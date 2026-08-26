import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHrOrAdmin, handleApiError } from "@/lib/rbac";
import { compassTipSchema } from "@/lib/validations/compass-tip";
import { logAudit } from "@/lib/audit";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireHrOrAdmin();
    const body = await request.json();
    const data = compassTipSchema.parse(body);
    const tip = await prisma.compassTip.update({ where: { id: params.id }, data });
    await logAudit({
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "CompassTip",
      entityId: tip.id,
      summary: `Изменён совет «${tip.title}» в Компас новичка`,
    });
    return NextResponse.json(tip);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireHrOrAdmin();
    const tip = await prisma.compassTip.delete({ where: { id: params.id } });
    await logAudit({
      actorId: session.user.id,
      action: "DELETE",
      entityType: "CompassTip",
      entityId: tip.id,
      summary: `Удалён совет «${tip.title}» из Компас новичка`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
