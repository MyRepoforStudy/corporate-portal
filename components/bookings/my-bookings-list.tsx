"use client";

import { useRouter } from "next/navigation";
import { CalendarX2, History } from "lucide-react";
import type { Room } from "@prisma/client";
import { formatTime } from "@/lib/booking-time";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatDateLong } from "@/lib/i18n/format";
import type { BookingUserSummary } from "@/types/booking";
import { useToast } from "@/components/ui/toast-provider";
import { EmptyState } from "@/components/ui/empty-state";

interface MyBooking {
  id: string;
  topic: string;
  startTime: Date;
  endTime: Date;
  status: "CONFIRMED" | "CANCELLED";
  room: Room;
  organizer: BookingUserSummary;
}

function formatDate(date: Date, locale: Locale): string {
  return formatDateLong(date, locale, true);
}

export function MyBookingsList({
  upcoming,
  past,
  currentUserId,
  locale,
  dict,
}: {
  upcoming: MyBooking[];
  past: MyBooking[];
  currentUserId: string;
  locale: Locale;
  dict: Dictionary["bookings"];
}) {
  const router = useRouter();
  const toast = useToast();

  async function handleCancel(bookingId: string) {
    if (!confirm(dict.confirmCancel)) return;
    const res = await fetch(`/api/bookings/${bookingId}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      const body = await res.json().catch(() => null);
      toast(body?.error ?? dict.cancelAction);
    }
  }

  function renderBooking(booking: MyBooking, allowCancel: boolean) {
    return (
      <div
        key={booking.id}
        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
      >
        <div>
          <p className="text-sm font-medium text-gray-900">
            {booking.topic}
            {booking.status === "CANCELLED" && (
              <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                {dict.myBookings.cancelledBadge}
              </span>
            )}
          </p>
          <p className="text-xs text-gray-500">
            {booking.room.name} · {formatDate(booking.startTime, locale)},{" "}
            {formatTime(booking.startTime)}–{formatTime(booking.endTime)}
            {booking.organizer.id !== currentUserId && (
              <> · {dict.myBookings.organizerLabel} {booking.organizer.displayName}</>
            )}
          </p>
        </div>
        {allowCancel && booking.status === "CONFIRMED" && booking.organizer.id === currentUserId && (
          <button
            onClick={() => handleCancel(booking.id)}
            className="shrink-0 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            {dict.cancelAction}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">{dict.myBookings.upcomingTitle}</h2>
        {upcoming.length === 0 ? (
          <EmptyState icon={CalendarX2} text={dict.myBookings.emptyUpcoming} />
        ) : (
          <div className="space-y-2">{upcoming.map((b) => renderBooking(b, true))}</div>
        )}
      </div>
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">{dict.myBookings.pastTitle}</h2>
        {past.length === 0 ? (
          <EmptyState icon={History} text={dict.myBookings.emptyPast} />
        ) : (
          <div className="space-y-2">{past.map((b) => renderBooking(b, false))}</div>
        )}
      </div>
    </div>
  );
}
