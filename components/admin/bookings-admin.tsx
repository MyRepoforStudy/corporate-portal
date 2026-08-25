"use client";

import { useEffect, useMemo, useState } from "react";
import type { Room } from "@prisma/client";
import { formatTime } from "@/lib/booking-time";
import type { BookingWithRelations } from "@/types/booking";

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Almaty",
  });
}

export function BookingsAdmin() {
  const [bookings, setBookings] = useState<(BookingWithRelations & { room: Room })[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [roomFilter, setRoomFilter] = useState("");

  async function load() {
    setIsLoading(true);
    const res = await fetch(`/api/bookings?from=${new Date().toISOString()}`);
    if (res.ok) setBookings(await res.json());
    setIsLoading(false);
  }

  useEffect(() => {
    load();
    fetch("/api/rooms")
      .then((r) => r.json())
      .then(setRooms);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (roomFilter && booking.roomId !== roomFilter) return false;
      if (!q) return true;
      return (
        booking.topic.toLowerCase().includes(q) ||
        booking.organizer.displayName.toLowerCase().includes(q)
      );
    });
  }, [bookings, query, roomFilter]);

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

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по теме или организатору..."
          className="w-64 rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm"
        />
        <select
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
          className="rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm"
        >
          <option value="">Все переговорные</option>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-gray-500">Загрузка...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500">
          {bookings.length === 0 ? "Предстоящих броней нет." : "По заданным фильтрам ничего не найдено."}
        </p>
      ) : (
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {filtered.map((booking) => (
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
