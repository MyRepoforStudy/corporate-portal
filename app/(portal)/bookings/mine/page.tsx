import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getDictionary } from "@/lib/i18n";
import { MyBookingsList } from "@/components/bookings/my-bookings-list";

export const dynamic = "force-dynamic";

export default async function MyBookingsPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;
  const locale = getLocale();
  const dict = getDictionary(locale);

  const bookings = await prisma.booking.findMany({
    where: {
      OR: [{ organizerId: userId }, { participants: { some: { id: userId } } }],
    },
    include: {
      room: true,
      organizer: { select: { id: true, displayName: true, email: true } },
    },
    orderBy: { startTime: "desc" },
  });

  const now = new Date();
  const upcoming = bookings
    .filter((b) => b.status === "CONFIRMED" && b.startTime >= now)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  const past = bookings.filter((b) => b.status !== "CONFIRMED" || b.startTime < now);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/bookings" className="text-sm text-brand-700 hover:underline dark:text-brand-300">
          {dict.bookings.myBookings.backLink}
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-gray-900">
          {dict.bookings.myBookings.title}
        </h1>
      </div>
      <MyBookingsList
        upcoming={upcoming}
        past={past}
        currentUserId={userId}
        locale={locale}
        dict={dict.bookings}
      />
    </div>
  );
}
