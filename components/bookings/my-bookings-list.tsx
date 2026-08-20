"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarX2, History } from "lucide-react";
import type { Room } from "@prisma/client";
import { formatTime } from "@/lib/booking-time";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatDateLong } from "@/lib/i18n/format";
import type { BookingUserSummary } from "@/types/booking";
import { useToast } from "@/components/ui/toast-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { BookingFormModal } from "@/components/bookings/booking-form-modal";

interface MyBooking {
  id: string;
  topic: string;
  startTime: Date;
  endTime: Date;
  status: "CONFIRMED" | "CANCELLED";
  recurrenceGroupId: string | null;
  roomId: string;
  room: Room;
  organizer: BookingUserSummary;
  participants: BookingUserSummary[];
}

function formatDate(date: Date, locale: Locale): string {
  return formatDateLong(date, locale, true);
}

export function MyBookingsList({
  upcoming,
  past,
  rooms,
  currentUserId,
  locale,
  dict,
}: {
  upcoming: MyBooking[];
  past: MyBooking[];
  rooms: Room[];
  currentUserId: string;
  locale: Locale;
  dict: Dictionary["bookings"];
}) {
  const router = useRouter();
  const toast = useToast();
  const [editingBooking, setEditingBooking] = useState<MyBooking | undefined>(undefined);

  async function handleCancel(booking: MyBooking) {
    if (!confirm(dict.confirmCancel)) return;
    const cancelSeries = booking.recurrenceGroupId && confirm(dict.confirmCancelSeries);
    const res = await fetch(
      `/api/bookings/${booking.id}${cancelSeries ? "?scope=series" : ""}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      router.refresh();
    } else {
      const body = await res.json().catch(() => null);
      toast(body?.error ?? dict.cancelAction);
    }
  }

  function renderBooking(booking: MyBooking, allowActions: boolean) {
    const isOwn = booking.organizer.id === currentUserId;
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
            {!isOwn && (
              <> · {dict.myBookings.organizerLabel} {booking.organizer.displayName}</>
            )}
          </p>
        </div>
        {allowActions && booking.status === "CONFIRMED" && isOwn && (
          <div className="flex shrink-0 items-center gap-3">
            <button
              onClick={() => setEditingBooking(booking)}
              className="text-sm text-brand-700 hover:underline dark:text-brand-300"
            >
              {dict.editAction}
            </button>
            <button
              onClick={() => handleCancel(booking)}
              className="text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              {dict.cancelAction}
            </button>
          </div>
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

      {editingBooking && (
        <BookingFormModal
          rooms={rooms}
          defaultRoomId={editingBooking.roomId}
          defaultDate={editingBooking.startTime}
          editingBooking={{
            id: editingBooking.id,
            topic: editingBooking.topic,
            roomId: editingBooking.roomId,
            startTime: editingBooking.startTime.toISOString(),
            endTime: editingBooking.endTime.toISOString(),
            status: editingBooking.status,
            recurrenceGroupId: editingBooking.recurrenceGroupId,
            organizer: editingBooking.organizer,
            participants: editingBooking.participants,
          }}
          onClose={() => setEditingBooking(undefined)}
          onCreated={() => {
            setEditingBooking(undefined);
            router.refresh();
          }}
          locale={locale}
          dict={dict}
        />
      )}
    </div>
  );
}
