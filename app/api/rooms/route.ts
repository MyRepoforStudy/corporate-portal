import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHrOrAdmin, requireSession, handleApiError } from "@/lib/rbac";
import { roomSchema } from "@/lib/validations/booking";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireSession();
    const rooms = await prisma.room.findMany({ orderBy: [{ floor: "asc" }, { name: "asc" }] });
    return NextResponse.json(rooms);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireHrOrAdmin();
    const body = await request.json();
    const data = roomSchema.parse(body);
    const room = await prisma.room.create({ data });
    await logAudit({
      actorId: session.user.id,
      action: "CREATE",
      entityType: "Room",
      entityId: room.id,
      summary: `Добавлена переговорная «${room.name}»`,
    });
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
