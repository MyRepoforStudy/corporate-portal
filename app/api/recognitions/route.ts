import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/rbac";
import { recognitionSchema } from "@/lib/validations/recognition";

const RECOGNITION_INCLUDE = {
  fromEmployee: { select: { id: true, fullName: true, photoUrl: true } },
  toEmployee: { select: { id: true, fullName: true, photoUrl: true } },
} as const;

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const limitParam = Number(searchParams.get("limit"));
    const take = Number.isInteger(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 10;

    const recognitions = await prisma.recognition.findMany({
      include: RECOGNITION_INCLUDE,
      orderBy: { createdAt: "desc" },
      take,
    });

    return NextResponse.json(recognitions);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const data = recognitionSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { employeeId: true },
    });
    if (!user?.employeeId) {
      throw new ApiError(400, "Ваш аккаунт не привязан к сотруднику в оргструктуре");
    }
    if (user.employeeId === data.toEmployeeId) {
      throw new ApiError(400, "Нельзя поблагодарить самого себя");
    }

    const recognition = await prisma.recognition.create({
      data: {
        title: data.title,
        message: data.message,
        fromEmployeeId: user.employeeId,
        toEmployeeId: data.toEmployeeId,
      },
      include: RECOGNITION_INCLUDE,
    });

    return NextResponse.json(recognition, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
