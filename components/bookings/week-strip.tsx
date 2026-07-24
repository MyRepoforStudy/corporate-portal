"use client";

import { addDays, formatDayLabel, startOfWeek } from "@/lib/booking-time";
import type { Locale } from "@/lib/i18n";
import { formatBookingsCount } from "@/lib/i18n/format";

export function WeekStrip({
  selectedDate,
  bookingCountByDay,
  onSelect,
  locale,
}: {
  selectedDate: Date;
  bookingCountByDay: Record<string, number>;
  onSelect: (date: Date) => void;
  locale: Locale;
}) {
  const monday = startOfWeek(selectedDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  return (
    <div className="flex gap-2 overflow-x-auto">
      {days.map((day) => {
        const key = day.toDateString();
        const isSelected = day.toDateString() === selectedDate.toDateString();
        const count = bookingCountByDay[key] ?? 0;

        return (
          <button
            key={key}
            onClick={() => onSelect(day)}
            className={`flex min-w-[84px] flex-col items-center rounded-lg border px-3 py-2 text-sm transition ${
              isSelected
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-sm"
            }`}
          >
            <span className="capitalize">{formatDayLabel(day, locale)}</span>
            <span className={`text-xs ${isSelected ? "text-brand-100" : "text-gray-500"}`}>
              {formatBookingsCount(count, locale)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
