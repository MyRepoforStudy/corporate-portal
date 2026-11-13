import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHrOrAdmin, handleApiError } from "@/lib/rbac";
import { aboutSectionSchema } from "@/lib/validations/about";
import { assertChapter, newAboutKey, nextAboutOrder } from "@/lib/about-db";
import { logAudit } from "@/lib/audit";

// All chapters and sections with every language (the admin list builds the tree itself).
export async function GET() {
  try {
    await requireHrOrAdmin();
    const rows = await prisma.aboutSection.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(rows);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireHrOrAdmin();
    const data = aboutSectionSchema.parse(await request.json());
    if (data.parentId) await assertChapter(data.parentId);

    const row = await prisma.aboutSection.create({
      data: { ...data, key: newAboutKey(), order: await nextAboutOrder(data.parentId) },
    });
    await logAudit({
      actorId: session.user.id,
      action: "CREATE",
      entityType: "AboutSection",
      entityId: row.id,
      summary: `${row.parentId ? "Добавлен раздел" : "Добавлена глава"} «О нас»: «${row.titleRu}»`,
    });
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
