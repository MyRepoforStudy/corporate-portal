import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/rbac";
import { resourceLinkSchema } from "@/lib/validations/resource-link";
import { logAudit } from "@/lib/audit";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const data = resourceLinkSchema.parse(body);
    const link = await prisma.resourceLink.update({ where: { id: params.id }, data });
    await logAudit({
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "ResourceLink",
      entityId: link.id,
      summary: `Изменён ресурс «${link.title}»`,
    });
    return NextResponse.json(link);
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
    const link = await prisma.resourceLink.delete({ where: { id: params.id } });
    await logAudit({
      actorId: session.user.id,
      action: "DELETE",
      entityType: "ResourceLink",
      entityId: link.id,
      summary: `Удалён ресурс «${link.title}»`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
