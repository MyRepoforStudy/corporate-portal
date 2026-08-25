import { CalendarHeart } from "lucide-react";
import type { Holiday } from "@prisma/client";
import type { Locale } from "@/lib/i18n";
import { formatDateLong } from "@/lib/i18n/format";

export function HolidaysWidget({
  holidays,
  locale,
  title,
}: {
  holidays: Holiday[];
  locale: Locale;
  title: string;
}) {
  if (holidays.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <CalendarHeart className="h-4 w-4 text-brand-600" />
        <h3 className="font-medium text-gray-900">{title}</h3>
      </div>
      <ul className="space-y-1 text-sm text-gray-700">
        {holidays.map((holiday) => (
          <li key={holiday.id} className="flex justify-between">
            <span>{holiday.title}</span>
            <span className="text-gray-500">{formatDateLong(holiday.date, locale)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
