import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();

    const booking = await prisma.booking.findUnique({ where: { id: params.id } });
    if (!booking) {
      throw new ApiError(404, "Бронь не найдена");
    }
    const isOwnBooking = booking.organizerId === session.user.id;
    if (!isOwnBooking && session.user.role !== "ADMIN") {
      throw new ApiError(403, "Можно отменить только свою бронь");
    }

    await prisma.booking.update({
      where: { id: params.id },
      data: { status: "CANCELLED" },
    });

    if (!isOwnBooking) {
      await logAudit({
        actorId: session.user.id,
        action: "UPDATE",
        entityType: "Booking",
        entityId: booking.id,
        summary: `Отменена чужая бронь «${booking.topic}»`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
