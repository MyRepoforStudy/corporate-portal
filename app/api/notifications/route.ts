import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/rbac";

export async function GET() {
  try {
    const session = await requireSession();
    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    const unreadCount = await prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    });
    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}
