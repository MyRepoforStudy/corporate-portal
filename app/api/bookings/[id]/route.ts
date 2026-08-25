import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { createBookingSchema } from "@/lib/validations/booking";
import { updateBookingWithOverlapCheck } from "@/lib/booking";
import { notifyUser } from "@/lib/notifications";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const existing = await prisma.booking.findUnique({ where: { id: params.id } });
    if (!existing) {
      throw new ApiError(404, "Бронь не найдена");
    }
    if (existing.organizerId !== session.user.id && session.user.role !== "ADMIN") {
      throw new ApiError(403, "Можно изменить только свою бронь");
    }

    const body = await request.json();
    const data = createBookingSchema.parse(body);

    const room = await prisma.room.findUnique({ where: { id: data.roomId } });
    if (!room) {
      throw new ApiError(404, "Переговорная не найдена");
    }
    if (!room.isActive) {
      throw new ApiError(400, "Переговорная недоступна для бронирования");
    }

    let booking;
    try {
      booking = await updateBookingWithOverlapCheck({
        bookingId: params.id,
        roomId: data.roomId,
        topic: data.topic,
        startTime: data.startTime,
        endTime: data.endTime,
        participantIds: data.participantIds,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "SLOT_TAKEN") {
        throw new ApiError(409, "Переговорная уже занята на выбранное время");
      }
      throw error;
    }

    const when = booking.startTime.toLocaleString("ru-RU", { timeZone: "Asia/Almaty" });
    await Promise.all(
      booking.participants
        .filter((p) => p.id !== session.user.id)
        .map((p) =>
          notifyUser({
            userId: p.id,
            email: p.email,
            type: "BOOKING_UPDATED",
            title: "Встреча изменена",
            message: `«${booking.topic}», ${when}`,
            link: "/bookings/mine",
          })
        )
    );

    return NextResponse.json(booking);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { organizer: true, participants: true },
    });
    if (!booking) {
      throw new ApiError(404, "Бронь не найдена");
    }
    const isOwnBooking = booking.organizerId === session.user.id;
    if (!isOwnBooking && session.user.role !== "ADMIN") {
      throw new ApiError(403, "Можно отменить только свою бронь");
    }

    const scope = new URL(request.url).searchParams.get("scope");
    const cancelSeries = scope === "series" && !!booking.recurrenceGroupId;

    const cancelled = cancelSeries
      ? await prisma.booking.findMany({
          where: {
            recurrenceGroupId: booking.recurrenceGroupId,
            status: "CONFIRMED",
            startTime: { gte: new Date() },
          },
          include: { organizer: true, participants: true },
        })
      : [booking];

    if (cancelSeries) {
      await prisma.booking.updateMany({
        where: { recurrenceGroupId: booking.recurrenceGroupId, status: "CONFIRMED", startTime: { gte: new Date() } },
        data: { status: "CANCELLED" },
      });
    } else {
      await prisma.booking.update({ where: { id: params.id }, data: { status: "CANCELLED" } });
    }

    if (!isOwnBooking) {
      await logAudit({
        actorId: session.user.id,
        action: "UPDATE",
        entityType: "Booking",
        entityId: booking.id,
        summary: `Отменена чужая бронь «${booking.topic}»${cancelSeries ? " (вся серия)" : ""}`,
      });
    }

    for (const b of cancelled) {
      const when = b.startTime.toLocaleString("ru-RU", { timeZone: "Asia/Almaty" });
      const recipients = new Map<string, { email: string }>();
      if (b.organizerId !== session.user.id) recipients.set(b.organizerId, { email: b.organizer.email });
      for (const p of b.participants) {
        if (p.id !== session.user.id) recipients.set(p.id, { email: p.email });
      }
      await Promise.all(
        [...recipients.entries()].map(([userId, { email }]) =>
          notifyUser({
            userId,
            email,
            type: "BOOKING_CANCELLED",
            title: "Встреча отменена",
            message: `«${b.topic}», ${when}`,
            link: "/bookings/mine",
          })
        )
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
