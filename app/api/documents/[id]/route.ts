import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHrOrAdmin, handleApiError } from "@/lib/rbac";
import { documentSchema } from "@/lib/validations/document";
import { logAudit } from "@/lib/audit";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireHrOrAdmin();
    const body = await request.json();
    const data = documentSchema.parse(body);
    const document = await prisma.document.update({ where: { id: params.id }, data });
    await logAudit({
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "Document",
      entityId: document.id,
      summary: `Изменён документ «${document.title}»`,
    });
    return NextResponse.json(document);
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
    const document = await prisma.document.delete({ where: { id: params.id } });
    await logAudit({
      actorId: session.user.id,
      action: "DELETE",
      entityType: "Document",
      entityId: document.id,
      summary: `Удалён документ «${document.title}»`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
