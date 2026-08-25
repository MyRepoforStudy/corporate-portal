import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/rbac";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const newsId = params.id;
    const userId = session.user.id;

    const existing = await prisma.newsLike.findUnique({
      where: { newsId_userId: { newsId, userId } },
    });

    if (existing) {
      await prisma.newsLike.delete({ where: { id: existing.id } });
    } else {
      await prisma.newsLike.create({ data: { newsId, userId } });
    }

    const count = await prisma.newsLike.count({ where: { newsId } });
    return NextResponse.json({ liked: !existing, count });
  } catch (error) {
    return handleApiError(error);
  }
}
