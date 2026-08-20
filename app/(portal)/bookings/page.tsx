import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BookingBoard } from "@/components/bookings/booking-board";
import { getLocale, getDictionary } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const session = await getServerSession(authOptions);
  const rooms = await prisma.room.findMany({
    where: { isActive: true },
    orderBy: [{ floor: "asc" }, { name: "asc" }],
  });
  const locale = getLocale();
  const dict = getDictionary(locale);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{dict.bookings.title}</h1>
          <p className="text-sm text-gray-500">{dict.bookings.subtitle}</p>
        </div>
        <Link href="/bookings/mine" className="shrink-0 text-sm text-brand-700 hover:underline dark:text-brand-300">
          {dict.bookings.myBookingsLink}
        </Link>
      </div>

      {rooms.length === 0 ? (
        <p className="text-sm text-gray-500">{dict.bookings.noRooms}</p>
      ) : (
        <BookingBoard
          rooms={rooms}
          currentUserId={session!.user.id}
          isAdmin={session!.user.role === "ADMIN"}
          locale={locale}
          dict={dict.bookings}
        />
      )}
    </div>
  );
}
