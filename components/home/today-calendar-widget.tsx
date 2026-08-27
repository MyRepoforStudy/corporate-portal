import { CalendarClock } from "lucide-react";
import type { Booking, Room, Holiday } from "@prisma/client";
import type { Locale } from "@/lib/i18n";
import { formatTime } from "@/lib/booking-time";
import { formatDateLong } from "@/lib/i18n/format";

export function TodayCalendarWidget({
  bookings,
  holiday,
  locale,
  title,
  emptyText,
}: {
  bookings: (Booking & { room: Room })[];
  holiday: Holiday | null;
  locale: Locale;
  title: string;
  emptyText: string;
}) {
  const hasContent = bookings.length > 0 || !!holiday;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-brand-600" aria-hidden="true" />
          <h3 className="font-medium text-gray-900">{title}</h3>
        </div>
        <span className="text-xs text-gray-400">{formatDateLong(new Date(), locale)}</span>
      </div>
      {!hasContent ? (
        <p className="text-sm text-gray-500">{emptyText}</p>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {holiday && (
            <li className="flex items-center gap-2 text-brand-700 dark:text-brand-300">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" aria-hidden="true" />
              {holiday.title}
            </li>
          )}
          {bookings.map((booking) => (
            <li key={booking.id} className="flex items-center justify-between gap-2 text-gray-700">
              <span className="min-w-0 truncate">
                <span className="font-medium text-gray-900">{formatTime(booking.startTime)}</span> · {booking.topic}
              </span>
              <span className="shrink-0 text-xs text-gray-400">{booking.room.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
