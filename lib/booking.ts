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
      include: {
        room: true,
        organizer: true,
        participants: true,
      },
    });
  });
}
