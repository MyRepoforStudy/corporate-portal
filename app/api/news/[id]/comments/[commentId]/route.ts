import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/rbac";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await requireSession();
    const comment = await prisma.newsComment.findUnique({ where: { id: params.commentId } });
    if (!comment) {
      throw new ApiError(404, "Комментарий не найден");
    }
    const isOwn = comment.authorId === session.user.id;
    const isModerator = session.user.role === "ADMIN" || session.user.role === "HR";
    if (!isOwn && !isModerator) {
      throw new ApiError(403, "Можно удалить только свой комментарий");
    }

    await prisma.newsComment.delete({ where: { id: params.commentId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
