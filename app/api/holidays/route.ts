import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession, handleApiError } from "@/lib/rbac";
import { holidaySchema } from "@/lib/validations/holiday";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireSession();
    const holidays = await prisma.holiday.findMany({ orderBy: { date: "asc" } });
    return NextResponse.json(holidays);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
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
