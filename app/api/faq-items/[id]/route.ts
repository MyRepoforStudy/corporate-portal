import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHrOrAdmin, handleApiError } from "@/lib/rbac";
import { faqItemSchema } from "@/lib/validations/faq-item";
import { logAudit } from "@/lib/audit";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireHrOrAdmin();
    const body = await request.json();
    const data = faqItemSchema.parse(body);
    const item = await prisma.faqItem.update({ where: { id: params.id }, data });
    await logAudit({
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "FaqItem",
      entityId: item.id,
      summary: `Изменён вопрос FAQ «${item.question}»`,
    });
    return NextResponse.json(item);
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
    const item = await prisma.faqItem.delete({ where: { id: params.id } });
    await logAudit({
      actorId: session.user.id,
      action: "DELETE",
      entityType: "FaqItem",
      entityId: item.id,
      summary: `Удалён вопрос FAQ «${item.question}»`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
