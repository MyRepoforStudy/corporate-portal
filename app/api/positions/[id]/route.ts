import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHrOrAdmin, handleApiError } from "@/lib/rbac";
import { positionSchema } from "@/lib/validations/org";
import { logAudit } from "@/lib/audit";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireHrOrAdmin();
    const body = await request.json();
    const data = positionSchema.parse(body);
    const position = await prisma.position.update({
      where: { id: params.id },
      data,
    });
    await logAudit({
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "Position",
      entityId: position.id,
      summary: `Изменена должность «${position.title}»`,
    });
    return NextResponse.json(position);
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
    const position = await prisma.position.delete({ where: { id: params.id } });
    await logAudit({
      actorId: session.user.id,
      action: "DELETE",
      entityType: "Position",
      entityId: position.id,
      summary: `Удалена должность «${position.title}»`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
