import Link from "next/link";
import { CalendarClock, Cake, UserPlus, Award } from "lucide-react";
import type { Booking, Room } from "@prisma/client";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatDateLong } from "@/lib/i18n/format";
import { formatTime } from "@/lib/booking-time";

type NearestBooking = Booking & { room: Room };

function StatTile({
  href,
  icon: Icon,
  label,
  value,
}: {
  href: string;
  icon: typeof CalendarClock;
  label: string;
  value: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-gray-200 bg-white p-3 transition hover:border-brand-300 hover:shadow-sm dark:hover:border-brand-700"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <p className="mt-2 text-xs text-gray-500">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-gray-900">{value}</p>
    </Link>
  );
}

export function HomeStats({
  nearestBooking,
  birthdaysCount,
  newHiresCount,
  recognitionsCount,
  locale,
  dict,
}: {
  nearestBooking: NearestBooking | null;
  birthdaysCount: number;
  newHiresCount: number;
  recognitionsCount: number;
  locale: Locale;
  dict: Dictionary["home"]["stats"];
}) {
  const bookingValue = nearestBooking
    ? `${formatDateLong(nearestBooking.startTime, locale)}, ${formatTime(nearestBooking.startTime)}`
    : dict.noBooking;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatTile href="/bookings" icon={CalendarClock} label={dict.nearestBooking} value={bookingValue} />
      <StatTile href="/org-structure" icon={Cake} label={dict.birthdays} value={String(birthdaysCount)} />
      <StatTile href="/org-structure" icon={UserPlus} label={dict.newHires} value={String(newHiresCount)} />
      <StatTile href="/#recognitions" icon={Award} label={dict.recognitions} value={String(recognitionsCount)} />
    </div>
  );
}
