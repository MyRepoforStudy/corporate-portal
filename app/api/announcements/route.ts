import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHrOrAdmin, requireSession, handleApiError } from "@/lib/rbac";
import { announcementSchema } from "@/lib/validations/announcement";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireSession();
    const announcements = await prisma.announcement.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(announcements);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireHrOrAdmin();
    const body = await request.json();
    const data = announcementSchema.parse(body);
    const announcement = await prisma.announcement.create({ data });
    await logAudit({
      actorId: session.user.id,
      action: "CREATE",
      entityType: "Announcement",
      entityId: announcement.id,
      summary: `Добавлено объявление «${announcement.title}»`,
    });
    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
