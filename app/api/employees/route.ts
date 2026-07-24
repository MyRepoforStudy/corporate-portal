import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHrOrAdmin, requireSession, handleApiError } from "@/lib/rbac";
import { employeeSchema } from "@/lib/validations/org";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const departmentId = searchParams.get("departmentId") ?? undefined;

    const employees = await prisma.employee.findMany({
      where: {
        departmentId,
        ...(q
          ? {
              OR: [
                { fullName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { department: { name: { contains: q, mode: "insensitive" } } },
                { position: { title: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: { department: true, position: true },
      orderBy: { fullName: "asc" },
    });

    return NextResponse.json(employees);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireHrOrAdmin();
    const body = await request.json();
    const data = employeeSchema.parse(body);
    const employee = await prisma.employee.create({
      data,
      include: { department: true, position: true },
    });
    await logAudit({
      actorId: session.user.id,
      action: "CREATE",
      entityType: "Employee",
      entityId: employee.id,
      summary: `Добавлен сотрудник «${employee.fullName}»`,
    });
    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
