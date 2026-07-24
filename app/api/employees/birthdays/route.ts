import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const month = Number(searchParams.get("month"));
    const day = Number(searchParams.get("day"));
    if (!Number.isInteger(month) || !Number.isInteger(day) || month < 1 || month > 12 || day < 1 || day > 31) {
      throw new ApiError(400, "Некорректная дата");
    }

    const employees = await prisma.employee.findMany({
      where: { birthDate: { not: null } },
      include: { department: true, position: true },
      orderBy: { fullName: "asc" },
    });

    const matches = employees.filter((e) => {
      const b = new Date(e.birthDate!);
      return b.getMonth() + 1 === month && b.getDate() === day;
    });

    return NextResponse.json(matches);
  } catch (error) {
    return handleApiError(error);
  }
}
