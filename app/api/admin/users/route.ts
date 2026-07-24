import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/rbac";

export async function GET() {
  try {
    await requireAdmin();
    const users = await prisma.user.findMany({
      orderBy: { displayName: "asc" },
      select: {
        id: true,
        ldapUid: true,
        email: true,
        displayName: true,
        role: true,
        canBookRooms: true,
        lastLoginAt: true,
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    return handleApiError(error);
  }
}
