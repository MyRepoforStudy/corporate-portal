import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHrOrAdmin, requireSession, handleApiError } from "@/lib/rbac";
import { documentSchema } from "@/lib/validations/document";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireSession();
    const documents = await prisma.document.findMany({
      orderBy: [{ order: "asc" }, { title: "asc" }],
    });
    return NextResponse.json(documents);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireHrOrAdmin();
    const body = await request.json();
    const data = documentSchema.parse(body);
    const document = await prisma.document.create({ data });
    await logAudit({
      actorId: session.user.id,
      action: "CREATE",
      entityType: "Document",
      entityId: document.id,
      summary: `Добавлен документ «${document.title}»`,
    });
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
