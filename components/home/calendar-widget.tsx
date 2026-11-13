import Link from "next/link";
import { CalendarClock, CalendarHeart } from "lucide-react";
import type { Booking, Holiday, Room } from "@prisma/client";
import { formatTime } from "@/lib/booking-time";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatDateLong } from "@/lib/i18n/format";

type NearestBooking = Booking & { room: Room };

/**
 * Upcoming holidays and the user's next room booking in one card (they used to
 * be two small cards one under the other). Without holidays only the booking
 * part is shown.
 */
export function CalendarWidget({
  holidays,
  booking,
  locale,
  dict,
  canBook,
}: {
  holidays: Holiday[];
  booking: NearestBooking | null;
  locale: Locale;
  dict: Dictionary["home"];
  /** The link to the bookings is only for people with booking access (a meeting they were invited to is still shown). */
  canBook: boolean;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      {holidays.length > 0 && (
        <section>
          <div className="mb-2 flex items-center gap-2">
            <CalendarHeart className="h-4 w-4 text-brand-600" aria-hidden="true" />
            <h3 className="font-medium text-gray-900">{dict.holidays.title}</h3>
          </div>
          <ul className="space-y-1 text-sm text-gray-700">
            {holidays.map((holiday) => (
              <li key={holiday.id} className="flex justify-between gap-3">
                <span>{holiday.title}</span>
                <span className="shrink-0 text-gray-500">{formatDateLong(holiday.date, locale)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={holidays.length > 0 ? "mt-4 border-t border-gray-100 pt-4" : ""}>
        <div className="mb-2 flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-brand-600" aria-hidden="true" />
          <h3 className="font-medium text-gray-900">{dict.nearestBooking.title}</h3>
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
          <p className="text-sm text-gray-500">{dict.nearestBooking.empty}</p>
        )}

        {canBook && (
          <Link
            href="/bookings"
            className="mt-3 inline-block text-sm font-medium text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
          >
            {dict.nearestBooking.cta}
          </Link>
        )}
      </section>
    </div>
  );
}
