"use client";

import { DAY_START_HOUR, DAY_END_HOUR, formatTime, positionInDay } from "@/lib/booking-time";
import type { BookingWithRelations } from "@/types/booking";

const HOURS = Array.from(
  { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
  (_, i) => DAY_START_HOUR + i
);

export function DayTimeline({
  bookings,
  currentUserId,
  isAdmin,
  onCancel,
  cancelLabel,
}: {
  bookings: BookingWithRelations[];
  currentUserId: string;
  isAdmin: boolean;
  onCancel: (bookingId: string) => void;
  cancelLabel: string;
}) {
  return (
    <div className="flex rounded-lg border border-gray-200 bg-white">
      <div className="w-14 shrink-0 border-r border-gray-100">
        {HOURS.map((hour, i) => (
          <div
            key={hour}
            className={`h-16 text-right text-xs text-gray-500 ${i === 0 ? "" : "-translate-y-2"}`}
          >
            {String(hour).padStart(2, "0")}:00
          </div>
        ))}
      </div>

      <div className="relative flex-1">
        {HOURS.map((hour) => (
          <div key={hour} className="h-16 border-b border-gray-100 last:border-0" />
        ))}

        {bookings.map((booking) => {
          const { topPercent, heightPercent } = positionInDay(
            booking.startTime,
            booking.endTime
          );
          const canCancel = isAdmin || booking.organizer.id === currentUserId;

          return (
            <div
              key={booking.id}
              className="group absolute left-1 right-1 overflow-hidden rounded-md border border-brand-200 bg-brand-50 px-2 py-1 text-xs dark:border-brand-800 dark:bg-brand-900/30"
              style={{ top: `${topPercent}%`, height: `${heightPercent}%` }}
            >
              <p className="truncate font-medium text-brand-900 dark:text-brand-100">{booking.topic}</p>
              <p className="truncate text-brand-700 dark:text-brand-300">
                {formatTime(booking.startTime)}–{formatTime(booking.endTime)} ·{" "}
                {booking.organizer.displayName}
              </p>
              {canCancel && (
                <button
                  onClick={() => onCancel(booking.id)}
                  className="absolute right-1 top-1 hidden rounded bg-white/80 px-1.5 py-0.5 text-[10px] text-red-600 dark:text-red-400 hover:bg-white group-hover:block"
                >
                  {cancelLabel}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
