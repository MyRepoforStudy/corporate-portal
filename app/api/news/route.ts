import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHrOrAdmin, handleApiError } from "@/lib/rbac";
import { newsSchema } from "@/lib/validations/news";
import { logAudit } from "@/lib/audit";
import { notifyPinnedNews } from "@/lib/notifications";

export async function GET() {
  try {
    await requireHrOrAdmin();
    const news = await prisma.news.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(news);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireHrOrAdmin();
    const body = await request.json();
    const data = newsSchema.parse(body);
    const news = await prisma.news.create({
      data: { ...data, authorId: session.user.id },
    });
    await logAudit({
      actorId: session.user.id,
      action: "CREATE",
      entityType: "News",
      entityId: news.id,
      summary: `Создана новость «${news.title}»`,
    });
    if (news.isPublished && news.isPinned) {
      await notifyPinnedNews(news, session.user.id);
    }
    return NextResponse.json(news, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
