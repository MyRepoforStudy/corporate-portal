import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireBookingPermission, handleApiError, ApiError } from "@/lib/rbac";
import { createBookingSchema } from "@/lib/validations/booking";
import { createBookingWithOverlapCheck } from "@/lib/booking";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId") ?? undefined;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const bookings = await prisma.booking.findMany({
      where: {
        roomId,
        status: "CONFIRMED",
        ...(from || to
          ? {
              startTime: from ? { gte: new Date(from) } : undefined,
              endTime: to ? { lte: new Date(to) } : undefined,
            }
          : {}),
      },
      include: {
        room: true,
        organizer: { select: { id: true, displayName: true, email: true } },
        participants: { select: { id: true, displayName: true, email: true } },
      },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireBookingPermission();
    const body = await request.json();
    const data = createBookingSchema.parse(body);

    try {
      const booking = await createBookingWithOverlapCheck({
        roomId: data.roomId,
        topic: data.topic,
        startTime: data.startTime,
        endTime: data.endTime,
        organizerId: session.user.id,
        participantIds: data.participantIds,
      });
      return NextResponse.json(booking, { status: 201 });
    } catch (error) {
      if (error instanceof Error && error.message === "SLOT_TAKEN") {
        throw new ApiError(409, "Переговорная уже занята на выбранное время");
      }
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
