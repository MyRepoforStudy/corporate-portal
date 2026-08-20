import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireBookingPermission, handleApiError, ApiError } from "@/lib/rbac";
import { createBookingSchema } from "@/lib/validations/booking";
import { createBookingWithOverlapCheck, createRecurringBookings } from "@/lib/booking";
import { notifyUser } from "@/lib/notifications";
import { formatTime } from "@/lib/booking-time";

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

function bookingEmailHtml(booking: {
  topic: string;
  startTime: Date;
  endTime: Date;
  room: { name: string };
  organizer: { displayName: string };
}, intro: string) {
  const date = booking.startTime.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  const time = `${formatTime(booking.startTime)}–${formatTime(booking.endTime)}`;
  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;white-space:nowrap;">${label}</td><td style="padding:4px 0;color:#111827;">${value}</td></tr>`;

  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;">
      <p style="color:#111827;">${intro}</p>
      <table style="border-collapse:collapse;font-size:14px;">
        ${row("Тема", `<strong>${booking.topic}</strong>`)}
        ${row("Переговорная", booking.room.name)}
        ${row("Дата", date)}
        ${row("Время", time)}
        ${row("Организатор", booking.organizer.displayName)}
      </table>
      <p style="margin-top:16px;">
        <a href="${(process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "")}/bookings/mine" style="color:#d80010;">Мои брони →</a>
      </p>
    </div>
  `;
}

async function notifyBookingCreated(booking: {
  id: string;
  topic: string;
  startTime: Date;
  endTime: Date;
  organizerId: string;
  room: { name: string };
  organizer: { id: string; email: string; displayName: string };
  participants: { id: string; email: string }[];
}) {
  const when = `${booking.startTime.toLocaleDateString("ru-RU")}, ${formatTime(booking.startTime)}`;
  await notifyUser({
    userId: booking.organizer.id,
    email: booking.organizer.email,
    type: "BOOKING_CREATED",
    title: "Бронь создана",
    message: `«${booking.topic}», ${when}`,
    link: "/bookings/mine",
    emailHtml: bookingEmailHtml(booking, "Ваша бронь переговорной подтверждена."),
  });
  await Promise.all(
    booking.participants
      .filter((p) => p.id !== booking.organizerId)
      .map((p) =>
        notifyUser({
          userId: p.id,
          email: p.email,
          type: "BOOKING_CREATED",
          title: "Вас пригласили на встречу",
          message: `«${booking.topic}», ${when}, организатор: ${booking.organizer.displayName}`,
          link: "/bookings/mine",
          emailHtml: bookingEmailHtml(booking, `${booking.organizer.displayName} пригласил(а) вас на встречу.`),
        })
      )
  );
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireBookingPermission();
    const body = await request.json();
    const data = createBookingSchema.parse(body);

    const room = await prisma.room.findUnique({ where: { id: data.roomId } });
    if (!room) {
      throw new ApiError(404, "Переговорная не найдена");
    }
    if (!room.isActive) {
      throw new ApiError(400, "Переговорная недоступна для бронирования");
    }

    if (data.recurrence) {
      const { created, skipped } = await createRecurringBookings({
        roomId: data.roomId,
        topic: data.topic,
        startTime: data.startTime,
        endTime: data.endTime,
        organizerId: session.user.id,
        participantIds: data.participantIds,
        frequency: data.recurrence.frequency,
        until: data.recurrence.until,
      });

      await Promise.all(created.map((booking) => notifyBookingCreated(booking)));

      return NextResponse.json(
        { created, skipped: skipped.map((s) => ({ date: s.date.toISOString(), reason: s.reason })) },
        { status: 201 }
      );
    }

    try {
      const booking = await createBookingWithOverlapCheck({
        roomId: data.roomId,
        topic: data.topic,
        startTime: data.startTime,
        endTime: data.endTime,
        organizerId: session.user.id,
        participantIds: data.participantIds,
      });
      await notifyBookingCreated(booking);
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
