"use client";

import { useState, type FormEvent } from "react";
import type { Room } from "@prisma/client";
import { createBookingSchema } from "@/lib/validations/booking";
import { toDateInputValue } from "@/lib/booking-time";
import { ParticipantPicker } from "@/components/bookings/participant-picker";
import type { BookingUserSummary } from "@/types/booking";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatFloor, formatCapacity } from "@/lib/i18n/format";

export function BookingFormModal({
  rooms,
  defaultRoomId,
  defaultDate,
  onClose,
  onCreated,
  locale,
  dict,
}: {
  rooms: Room[];
  defaultRoomId: string;
  defaultDate: Date;
  onClose: () => void;
  onCreated: () => void;
  locale: Locale;
  dict: Dictionary["bookings"];
}) {
  const [roomId, setRoomId] = useState(defaultRoomId);
  const [date, setDate] = useState(toDateInputValue(defaultDate));
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [topic, setTopic] = useState("");
  const [participants, setParticipants] = useState<BookingUserSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = createBookingSchema.safeParse({
      roomId,
      topic,
      startTime: new Date(`${date}T${startTime}:00`),
      endTime: new Date(`${date}T${endTime}:00`),
      participantIds: participants.map((p) => p.id),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? dict.modal.genericValidationError);
      return;
    }

    setIsSubmitting(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setIsSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? dict.modal.createFailed);
      return;
    }

    onCreated();
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">{dict.modal.title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {dict.modal.room}
            </label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} · {formatFloor(room.floor, locale)} · {formatCapacity(room.capacity, locale)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{dict.modal.date}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {dict.modal.start}
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {dict.modal.end}
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {dict.modal.topic}
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={dict.modal.topicPlaceholder}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            />
          </div>

          <ParticipantPicker selected={participants} onChange={setParticipants} dict={dict.participants} />

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              {dict.modal.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {isSubmitting ? dict.modal.submitting : dict.modal.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
