import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/rbac";
import { departmentSchema } from "@/lib/validations/org";
import { logAudit } from "@/lib/audit";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const data = departmentSchema.parse(body);

    if (data.parentId === params.id) {
      return NextResponse.json(
        { error: "Отдел не может быть родителем самого себя" },
        { status: 400 }
      );
    }

    const department = await prisma.department.update({
      where: { id: params.id },
      data,
    });
    await logAudit({
      actorId: session.user.id,
      action: "UPDATE",
      entityType: "Department",
      entityId: department.id,
      summary: `Изменён отдел «${department.name}»`,
    });
    return NextResponse.json(department);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();
    const department = await prisma.department.delete({ where: { id: params.id } });
    await logAudit({
      actorId: session.user.id,
      action: "DELETE",
      entityType: "Department",
      entityId: department.id,
      summary: `Удалён отдел «${department.name}»`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
