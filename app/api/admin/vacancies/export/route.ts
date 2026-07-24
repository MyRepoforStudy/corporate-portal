import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/rbac";
import { toCsv } from "@/lib/csv";
import { getDepartmentPath } from "@/lib/org-tree";

export async function GET() {
  try {
    await requireAdmin();

    const [vacancies, departments] = await Promise.all([
      prisma.vacancy.findMany({
        include: { position: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.department.findMany(),
    ]);

    const csv = toCsv([
      ["department_path", "position", "note"],
      ...vacancies.map((v) => [
        getDepartmentPath(departments, v.departmentId)
          .map((d) => d.name)
          .join(">"),
        v.position.title,
        v.note ?? "",
      ]),
    ]);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="vacancies.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
