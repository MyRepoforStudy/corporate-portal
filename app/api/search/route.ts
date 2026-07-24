import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/rbac";

const LIMIT = 5;

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ employees: [], departments: [], rooms: [] });
    }

    const [employees, departments, rooms] = await Promise.all([
      prisma.employee.findMany({
        where: {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        include: { department: true, position: true },
        orderBy: { fullName: "asc" },
        take: LIMIT,
      }),
      prisma.department.findMany({
        where: { name: { contains: q, mode: "insensitive" } },
        orderBy: { name: "asc" },
        take: LIMIT,
      }),
      prisma.room.findMany({
        where: { name: { contains: q, mode: "insensitive" } },
        orderBy: { name: "asc" },
        take: LIMIT,
      }),
    ]);

    return NextResponse.json({ employees, departments, rooms });
  } catch (error) {
    return handleApiError(error);
  }
}
