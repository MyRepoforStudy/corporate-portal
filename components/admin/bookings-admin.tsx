"use client";

import { useEffect, useState } from "react";
import { formatTime } from "@/lib/booking-time";
import type { BookingWithRelations } from "@/types/booking";

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export function BookingsAdmin() {
  const [bookings, setBookings] = useState<(BookingWithRelations & { room: { name: string } })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    const res = await fetch(`/api/bookings?from=${new Date().toISOString()}`);
    if (res.ok) setBookings(await res.json());
    setIsLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCancel(id: string) {
    if (!confirm("Отменить эту бронь?")) return;
    const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    if (res.ok) {
      load();
    } else {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Не удалось отменить бронь");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Все бронирования</h1>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-gray-500">Загрузка...</p>
      ) : bookings.length === 0 ? (
        <p className="text-sm text-gray-500">Предстоящих броней нет.</p>
      ) : (
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {bookings.map((booking) => (
            <div key={booking.id} className="flex items-center justify-between px-4 py-2.5">
              <div>
                <p className="text-sm font-medium text-gray-900">{booking.topic}</p>
                <p className="text-xs text-gray-500">
                  {booking.room.name} · {formatDate(booking.startTime)},{" "}
                  {formatTime(booking.startTime)}–{formatTime(booking.endTime)} · организатор:{" "}
                  {booking.organizer.displayName}
                </p>
              </div>
              <button
                onClick={() => handleCancel(booking.id)}
                className="shrink-0 text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Отменить
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
