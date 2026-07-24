"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Room } from "@prisma/client";
import { addDays, startOfDay, startOfWeek } from "@/lib/booking-time";
import { WeekStrip } from "@/components/bookings/week-strip";
import { DayTimeline } from "@/components/bookings/day-timeline";
import { BookingFormModal } from "@/components/bookings/booking-form-modal";
import type { BookingWithRelations } from "@/types/booking";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatFloor, formatCapacity } from "@/lib/i18n/format";
import { SkeletonLines } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast-provider";

export function BookingBoard({
  rooms,
  currentUserId,
  isAdmin,
  locale,
  dict,
}: {
  rooms: Room[];
  currentUserId: string;
  isAdmin: boolean;
  locale: Locale;
  dict: Dictionary["bookings"];
}) {
  const searchParams = useSearchParams();
  const [roomId, setRoomId] = useState(() => searchParams.get("room") ?? rooms[0]?.id ?? "");
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [weekBookings, setWeekBookings] = useState<BookingWithRelations[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const loadWeek = useCallback(async () => {
    if (!roomId) return;
    setIsLoading(true);
    const from = startOfWeek(selectedDate);
    const to = addDays(from, 7);
    const res = await fetch(
      `/api/bookings?roomId=${roomId}&from=${from.toISOString()}&to=${to.toISOString()}`
    );
    if (res.ok) {
      setWeekBookings(await res.json());
    }
    setIsLoading(false);
  }, [roomId, selectedDate]);

  useEffect(() => {
    loadWeek();
  }, [loadWeek]);

  const bookingCountByDay = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const booking of weekBookings) {
      const key = new Date(booking.startTime).toDateString();
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [weekBookings]);

  const dayBookings = useMemo(
    () =>
      weekBookings.filter(
        (b) => new Date(b.startTime).toDateString() === selectedDate.toDateString()
      ),
    [weekBookings, selectedDate]
  );

  async function handleCancel(bookingId: string) {
    if (!confirm(dict.confirmCancel)) return;
    const res = await fetch(`/api/bookings/${bookingId}`, { method: "DELETE" });
    if (res.ok) {
      loadWeek();
    } else {
      const body = await res.json().catch(() => null);
      toast(body?.error ?? dict.cancelAction);
    }
  }

  const selectedRoom = rooms.find((r) => r.id === roomId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name} · {formatFloor(room.floor, locale)} · {formatCapacity(room.capacity, locale)}
            </option>
          ))}
        </select>

        <button
          onClick={() => setIsFormOpen(true)}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {dict.newBooking}
        </button>
      </div>

      {selectedRoom?.equipment.length ? (
        <p className="text-xs text-gray-500">
          {dict.equipment} {selectedRoom.equipment.join(", ")}
        </p>
      ) : null}

      <WeekStrip
        selectedDate={selectedDate}
        bookingCountByDay={bookingCountByDay}
        onSelect={setSelectedDate}
        locale={locale}
      />

      {isLoading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <SkeletonLines count={4} />
        </div>
      ) : (
        <DayTimeline
          bookings={dayBookings}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onCancel={handleCancel}
          cancelLabel={dict.cancelAction}
        />
      )}

      {isFormOpen && (
        <BookingFormModal
          rooms={rooms}
          defaultRoomId={roomId}
          defaultDate={selectedDate}
          onClose={() => setIsFormOpen(false)}
          onCreated={() => {
            setIsFormOpen(false);
            loadWeek();
          }}
          locale={locale}
          dict={dict}
        />
      )}
    </div>
  );
}
