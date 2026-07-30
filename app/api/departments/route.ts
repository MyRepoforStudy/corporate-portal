import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSession, handleApiError } from "@/lib/rbac";
import { departmentSchema } from "@/lib/validations/org";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireSession();
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { employees: true } },
        headEmployee: { select: { id: true, fullName: true, photoUrl: true, position: { select: { title: true } } } },
      },
    });
    return NextResponse.json(departments);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const data = departmentSchema.parse(body);
    const department = await prisma.department.create({ data });
    await logAudit({
      actorId: session.user.id,
      action: "CREATE",
      entityType: "Department",
      entityId: department.id,
      summary: `Создан отдел «${department.name}»`,
    });
    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
