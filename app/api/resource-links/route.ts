import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession, handleApiError } from "@/lib/rbac";
import { resourceLinkSchema } from "@/lib/validations/resource-link";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireSession();
    const links = await prisma.resourceLink.findMany({
      orderBy: [{ order: "asc" }, { title: "asc" }],
    });
    return NextResponse.json(links);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const data = resourceLinkSchema.parse(body);
    const link = await prisma.resourceLink.create({ data });
    await logAudit({
      actorId: session.user.id,
      action: "CREATE",
      entityType: "ResourceLink",
      entityId: link.id,
      summary: `Добавлен ресурс «${link.title}»`,
    });
    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
