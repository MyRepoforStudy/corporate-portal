import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/rbac";
import { newsCommentSchema } from "@/lib/validations/news-comment";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireSession();
    const comments = await prisma.newsComment.findMany({
      where: { newsId: params.id },
      include: { author: { select: { id: true, displayName: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(comments);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const data = newsCommentSchema.parse(body);
    const comment = await prisma.newsComment.create({
      data: { newsId: params.id, authorId: session.user.id, content: data.content },
      include: { author: { select: { id: true, displayName: true } } },
    });
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
