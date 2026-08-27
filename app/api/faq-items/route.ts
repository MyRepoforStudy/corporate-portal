import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHrOrAdmin, requireSession, handleApiError } from "@/lib/rbac";
import { faqItemSchema } from "@/lib/validations/faq-item";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireSession();
    const items = await prisma.faqItem.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(items);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireHrOrAdmin();
    const body = await request.json();
    const data = faqItemSchema.parse(body);
    const item = await prisma.faqItem.create({ data });
    await logAudit({
      actorId: session.user.id,
      action: "CREATE",
      entityType: "FaqItem",
      entityId: item.id,
      summary: `Добавлен вопрос FAQ «${item.question}»`,
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
