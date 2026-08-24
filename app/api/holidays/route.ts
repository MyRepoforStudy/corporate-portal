import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHrOrAdmin, handleApiError } from "@/lib/rbac";
import { holidaySchema } from "@/lib/validations/calendar";
import { logAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const session = await requireHrOrAdmin();
    const body = await request.json();
    const data = holidaySchema.parse(body);
    const holiday = await prisma.holiday.create({ data });
    await logAudit({
      actorId: session.user.id,
      action: "CREATE",
      entityType: "Holiday",
      entityId: holiday.id,
      summary: `Добавлен праздник «${holiday.title}»`,
    });
    return NextResponse.json(holiday, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
