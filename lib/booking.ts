import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function hasOverlappingBooking(
  tx: Prisma.TransactionClient,
  params: { roomId: string; startTime: Date; endTime: Date; excludeBookingId?: string }
): Promise<boolean> {
  const conflict = await tx.booking.findFirst({
    where: {
      roomId: params.roomId,
      status: "CONFIRMED",
      id: params.excludeBookingId ? { not: params.excludeBookingId } : undefined,
      startTime: { lt: params.endTime },
      endTime: { gt: params.startTime },
    },
    select: { id: true },
  });
  return conflict !== null;
}

const bookingInclude = {
  room: true,
  organizer: true,
  participants: true,
} satisfies Prisma.BookingInclude;

export async function createBookingWithOverlapCheck(params: {
  roomId: string;
  topic: string;
  startTime: Date;
  endTime: Date;
  organizerId: string;
  participantIds: string[];
}) {
  return prisma.$transaction(async (tx) => {
    const overlapping = await hasOverlappingBooking(tx, params);
    if (overlapping) {
      throw new Error("SLOT_TAKEN");
    }

    return tx.booking.create({
      data: {
        roomId: params.roomId,
        topic: params.topic,
        startTime: params.startTime,
        endTime: params.endTime,
        organizerId: params.organizerId,
        participants: { connect: params.participantIds.map((id) => ({ id })) },
      },
      include: bookingInclude,
    });
  });
}

export async function updateBookingWithOverlapCheck(params: {
  bookingId: string;
  roomId: string;
  topic: string;
  startTime: Date;
  endTime: Date;
  participantIds: string[];
}) {
  return prisma.$transaction(async (tx) => {
    const overlapping = await hasOverlappingBooking(tx, { ...params, excludeBookingId: params.bookingId });
    if (overlapping) {
      throw new Error("SLOT_TAKEN");
    }

    return tx.booking.update({
      where: { id: params.bookingId },
      data: {
        roomId: params.roomId,
        topic: params.topic,
        startTime: params.startTime,
        endTime: params.endTime,
        participants: { set: params.participantIds.map((id) => ({ id })) },
      },
      include: bookingInclude,
    });
  });
}

/**
 * Materializes one Booking row per occurrence (not a computed series) so
 * each goes through the normal overlap check independently. A room conflict
 * on one date is skipped rather than failing the whole series. All rows
 * share recurrenceGroupId (the first occurrence's own id).
 */
export async function createRecurringBookings(params: {
  roomId: string;
  topic: string;
  startTime: Date;
  endTime: Date;
  organizerId: string;
  participantIds: string[];
  frequency: "DAILY" | "WEEKLY";
  until: Date;
}) {
  const stepMs = (params.frequency === "DAILY" ? 1 : 7) * 24 * 60 * 60 * 1000;
  const durationMs = params.endTime.getTime() - params.startTime.getTime();

  const occurrenceStarts: Date[] = [];
  for (let t = params.startTime.getTime(); t <= params.until.getTime(); t += stepMs) {
    occurrenceStarts.push(new Date(t));
  }

  const created: Prisma.BookingGetPayload<{ include: typeof bookingInclude }>[] = [];
  const skipped: { date: Date; reason: string }[] = [];
  let recurrenceGroupId: string | undefined;

  for (const occurrenceStart of occurrenceStarts) {
    const occurrenceEnd = new Date(occurrenceStart.getTime() + durationMs);
    try {
      const booking = await prisma.$transaction(async (tx) => {
        const overlapping = await hasOverlappingBooking(tx, {
          roomId: params.roomId,
          startTime: occurrenceStart,
          endTime: occurrenceEnd,
        });
        if (overlapping) {
          throw new Error("SLOT_TAKEN");
        }

        const booking = await tx.booking.create({
          data: {
            roomId: params.roomId,
            topic: params.topic,
            startTime: occurrenceStart,
            endTime: occurrenceEnd,
            organizerId: params.organizerId,
            participants: { connect: params.participantIds.map((id) => ({ id })) },
            recurrenceGroupId,
          },
          include: bookingInclude,
        });

        if (!recurrenceGroupId) {
          await tx.booking.update({ where: { id: booking.id }, data: { recurrenceGroupId: booking.id } });
          booking.recurrenceGroupId = booking.id;
        }
        return booking;
      });

      recurrenceGroupId ??= booking.id;
      created.push(booking);
    } catch (error) {
      skipped.push({
        date: occurrenceStart,
        reason: error instanceof Error && error.message === "SLOT_TAKEN" ? "SLOT_TAKEN" : "UNKNOWN",
      });
    }
  }

  return { created, skipped };
}
