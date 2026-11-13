import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHrOrAdmin, handleApiError, ApiError } from "@/lib/rbac";
import { aboutSectionSchema } from "@/lib/validations/about";
import { assertChapter, nextAboutOrder } from "@/lib/about-db";
import { logAudit } from "@/lib/audit";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireHrOrAdmin();
    const data = aboutSectionSchema.parse(await request.json());
    const existing = await prisma.aboutSection.findUniqueOrThrow({ where: { id: params.id } });

    // A chapter stays a chapter; a section may move to another chapter but cannot become one.
    const parentId = existing.parentId === null ? null : data.parentId;
    if (existing.parentId !== null && parentId === null) {
      throw new ApiError(400, "Раздел должен принадлежать главе");
    }
    if (parentId) await assertChapter(parentId);

    const moved = parentId !== existing.parentId;
    const row = await prisma.aboutSection.update({
      where: { id: params.id },
      // `key` never changes: the JSON import matches rows by it
      data: { ...data, parentId, ...(moved ? { order: await nextAboutOrder(parentId) } : {}) },
    });
    await logAudit({
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "AboutSection",
      entityId: row.id,
      summary: `${row.parentId ? "Изменён раздел" : "Изменена глава"} «О нас»: «${row.titleRu}»`,
    });
    return NextResponse.json(row);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireHrOrAdmin();
    const sections = await prisma.aboutSection.count({ where: { parentId: params.id } });
    const row = await prisma.aboutSection.delete({ where: { id: params.id } });
    await logAudit({
      actorId: session.user.id,
      action: "DELETE",
      entityType: "AboutSection",
      entityId: row.id,
      summary: row.parentId
        ? `Удалён раздел «О нас»: «${row.titleRu}»`
        : `Удалена глава «О нас»: «${row.titleRu}» (разделов в ней: ${sections})`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
