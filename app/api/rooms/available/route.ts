import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");
    const capacityParam = searchParams.get("capacity");

    if (!startParam || !endParam) {
      throw new ApiError(400, "Укажите начало и конец периода");
    }
    const start = new Date(startParam);
    const end = new Date(endParam);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      throw new ApiError(400, "Некорректный период");
    }
    const capacity = capacityParam ? Number(capacityParam) : undefined;

    const rooms = await prisma.room.findMany({
      where: {
        isActive: true,
        capacity: capacity ? { gte: capacity } : undefined,
        bookings: {
          none: {
            status: "CONFIRMED",
            startTime: { lt: end },
            endTime: { gt: start },
          },
        },
      },
      orderBy: [{ capacity: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(rooms);
  } catch (error) {
    return handleApiError(error);
  }
}
