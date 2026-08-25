"use client";

import { useState } from "react";
import type { Room } from "@prisma/client";
import { toDateInputValue } from "@/lib/booking-time";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatFloor, formatCapacity } from "@/lib/i18n/format";

export function FindRoomSearch({
  onClose,
  onSelectRoom,
  defaultDate,
  locale,
  dict,
}: {
  onClose: () => void;
  onSelectRoom: (room: Room, date: Date, start: string, end: string) => void;
  defaultDate: Date;
  locale: Locale;
  dict: Dictionary["bookings"]["findRoom"];
}) {
  const [date, setDate] = useState(toDateInputValue(defaultDate));
  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("11:00");
  const [capacity, setCapacity] = useState("");
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    setError(null);
    setIsSearching(true);
    const params = new URLSearchParams({
      start: new Date(`${date}T${start}:00`).toISOString(),
      end: new Date(`${date}T${end}:00`).toISOString(),
    });
    if (capacity) params.set("capacity", capacity);

    const res = await fetch(`/api/rooms/available?${params.toString()}`);
    setIsSearching(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? dict.searchFailed);
      return;
    }
    setRooms(await res.json());
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-900">{dict.title}</h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">{dict.date}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{dict.start}</label>
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{dict.end}</label>
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">{dict.minCapacity}</label>
            <input
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder={dict.minCapacityPlaceholder}
              className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            {dict.close}
          </button>
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {isSearching ? dict.searching : dict.search}
          </button>
        </div>

        {rooms && (
          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto border-t border-gray-100 pt-4">
            {rooms.length === 0 ? (
              <p className="text-sm text-gray-500">{dict.empty}</p>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{room.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFloor(room.floor, locale)} · {formatCapacity(room.capacity, locale)}
                      {room.equipment.length > 0 && ` · ${room.equipment.join(", ")}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectRoom(room, new Date(`${date}T00:00:00`), start, end)}
                    className="shrink-0 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
                  >
                    {dict.book}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
