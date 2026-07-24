import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHrOrAdmin, handleApiError } from "@/lib/rbac";
import { toCsv } from "@/lib/csv";
import { getDepartmentPath } from "@/lib/org-tree";

export async function GET() {
  try {
    await requireHrOrAdmin();

    const [employees, departments] = await Promise.all([
      prisma.employee.findMany({
        include: { department: true, position: true },
        orderBy: { fullName: "asc" },
      }),
      prisma.department.findMany(),
    ]);

    const csv = toCsv([
      ["fullName", "email", "phone", "department_path", "position", "birthDate", "hireDate"],
      ...employees.map((e) => [
        e.fullName,
        e.email,
        e.phone ?? "",
        getDepartmentPath(departments, e.departmentId)
          .map((d) => d.name)
          .join(">"),
        e.position.title,
        e.birthDate ? e.birthDate.toISOString().slice(0, 10) : "",
        e.hireDate ? e.hireDate.toISOString().slice(0, 10) : "",
      ]),
    ]);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="employees.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
