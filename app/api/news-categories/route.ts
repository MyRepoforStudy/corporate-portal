import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireHrOrAdmin, handleApiError } from "@/lib/rbac";
import { newsCategorySchema } from "@/lib/validations/news-category";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireSession();
    const categories = await prisma.newsCategory.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] });
    return NextResponse.json(categories);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireHrOrAdmin();
    const body = await request.json();
    const data = newsCategorySchema.parse(body);
    const category = await prisma.newsCategory.create({ data });
    await logAudit({
      actorId: session.user.id,
      action: "CREATE",
      entityType: "NewsCategory",
      entityId: category.id,
      summary: `Добавлена категория новостей «${category.name}»`,
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
