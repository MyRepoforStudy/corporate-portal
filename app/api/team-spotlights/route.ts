import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession, handleApiError } from "@/lib/rbac";
import { teamSpotlightSchema } from "@/lib/validations/team-spotlight";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireSession();
    const spotlights = await prisma.teamSpotlight.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] });
    return NextResponse.json(spotlights);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const data = teamSpotlightSchema.parse(body);
    const spotlight = await prisma.teamSpotlight.create({ data });
    await logAudit({
      actorId: session.user.id,
      action: "CREATE",
      entityType: "TeamSpotlight",
      entityId: spotlight.id,
      summary: `Добавлено фото в «Команда в деле»: «${spotlight.caption}»`,
    });
    return NextResponse.json(spotlight, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
