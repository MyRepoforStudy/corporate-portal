import Link from "next/link";
import { CalendarClock } from "lucide-react";
import type { Booking, Room } from "@prisma/client";
import { formatTime } from "@/lib/booking-time";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatDateLong } from "@/lib/i18n/format";

type NearestBooking = Booking & { room: Room };

export function NearestBookingWidget({
  booking,
  locale,
  dict,
}: {
  booking: NearestBooking | null;
  locale: Locale;
  dict: Dictionary["home"]["nearestBooking"];
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-brand-600" />
        <h3 className="font-medium text-gray-900">{dict.title}</h3>
      </div>

      {booking ? (
        <div className="text-sm text-gray-700">
          <p className="font-medium">{booking.topic}</p>
          <p className="text-gray-500">
            {booking.room.name} · {formatDateLong(booking.startTime, locale)},{" "}
            {formatTime(booking.startTime)}–{formatTime(booking.endTime)}
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-500">{dict.empty}</p>
      )}

      <Link
        href="/bookings"
        className="mt-3 inline-block text-sm font-medium text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
      >
        {dict.cta}
      </Link>
    </div>
  );
}
