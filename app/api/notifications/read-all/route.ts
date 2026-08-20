import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/rbac";

export async function PATCH() {
  try {
    const session = await requireSession();
    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
