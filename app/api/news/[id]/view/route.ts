import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/rbac";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireSession();
    const news = await prisma.news.update({
      where: { id: params.id },
      data: { views: { increment: 1 } },
      select: { views: true },
    });
    return NextResponse.json(news);
  } catch (error) {
    return handleApiError(error);
  }
}
