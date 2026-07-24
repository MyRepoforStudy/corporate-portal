import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession, handleApiError } from "@/lib/rbac";
import { positionSchema } from "@/lib/validations/org";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireSession();
    const positions = await prisma.position.findMany({
      orderBy: [{ rank: "desc" }, { title: "asc" }],
    });
    return NextResponse.json(positions);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const data = positionSchema.parse(body);
    const position = await prisma.position.create({ data });
    await logAudit({
      actorId: session.user.id,
      action: "CREATE",
      entityType: "Position",
      entityId: position.id,
      summary: `Создана должность «${position.title}»`,
    });
    return NextResponse.json(position, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
