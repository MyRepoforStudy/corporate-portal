import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/rbac";

export async function GET() {
  try {
    await requireAdmin();
    const requests = await prisma.itRequest.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: { requester: { select: { displayName: true, email: true } } },
    });
    return NextResponse.json(requests);
  } catch (error) {
    return handleApiError(error);
  }
}
