import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/rbac";
import { teamSpotlightSchema } from "@/lib/validations/team-spotlight";
import { logAudit } from "@/lib/audit";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const data = teamSpotlightSchema.parse(body);
    const spotlight = await prisma.teamSpotlight.update({ where: { id: params.id }, data });
    await logAudit({
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "TeamSpotlight",
      entityId: spotlight.id,
      summary: `Изменено фото в «Команда в деле»: «${spotlight.caption}»`,
    });
    return NextResponse.json(spotlight);
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
    const spotlight = await prisma.teamSpotlight.delete({ where: { id: params.id } });
    await logAudit({
      actorId: session.user.id,
      action: "DELETE",
      entityType: "TeamSpotlight",
      entityId: spotlight.id,
      summary: `Удалено фото в «Команда в деле»: «${spotlight.caption}»`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
