import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHrOrAdmin, handleApiError } from "@/lib/rbac";
import { newsCategorySchema } from "@/lib/validations/news-category";
import { logAudit } from "@/lib/audit";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireHrOrAdmin();
    const body = await request.json();
    const data = newsCategorySchema.parse(body);
    const category = await prisma.newsCategory.update({ where: { id: params.id }, data });
    await logAudit({
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "NewsCategory",
      entityId: category.id,
      summary: `Изменена категория новостей «${category.name}»`,
    });
    return NextResponse.json(category);
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
    const category = await prisma.newsCategory.delete({ where: { id: params.id } });
    await logAudit({
      actorId: session.user.id,
      action: "DELETE",
      entityType: "NewsCategory",
      entityId: category.id,
      summary: `Удалена категория новостей «${category.name}»`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
