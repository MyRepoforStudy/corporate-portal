import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHrOrAdmin, requireSession, handleApiError } from "@/lib/rbac";
import { compassTipSchema } from "@/lib/validations/compass-tip";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireSession();
    const tips = await prisma.compassTip.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(tips);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireHrOrAdmin();
    const body = await request.json();
    const data = compassTipSchema.parse(body);
    const tip = await prisma.compassTip.create({ data });
    await logAudit({
      actorId: session.user.id,
      action: "CREATE",
      entityType: "CompassTip",
      entityId: tip.id,
      summary: `Добавлен совет «${tip.title}» в Компас новичка`,
    });
    return NextResponse.json(tip, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
