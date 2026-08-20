"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { Room } from "@prisma/client";
import { createBookingSchema } from "@/lib/validations/booking";
import { toDateInputValue } from "@/lib/booking-time";
import { ParticipantPicker } from "@/components/bookings/participant-picker";
import type { BookingUserSummary, BookingWithRelations } from "@/types/booking";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatFloor, formatCapacity } from "@/lib/i18n/format";

export function BookingFormModal({
  rooms,
  defaultRoomId,
  defaultDate,
  defaultStartTime,
  defaultEndTime,
  editingBooking,
  onClose,
  onCreated,
  locale,
  dict,
}: {
  rooms: Room[];
  defaultRoomId: string;
  defaultDate: Date;
  defaultStartTime?: string;
  defaultEndTime?: string;
  editingBooking?: BookingWithRelations;
  onClose: () => void;
  onCreated: () => void;
  locale: Locale;
  dict: Dictionary["bookings"];
}) {
  const isEditing = !!editingBooking;

  const [roomId, setRoomId] = useState(editingBooking?.roomId ?? defaultRoomId);
  const [date, setDate] = useState(
    toDateInputValue(editingBooking ? new Date(editingBooking.startTime) : defaultDate)
  );
  const [startTime, setStartTime] = useState(
    editingBooking ? formatInputTime(editingBooking.startTime) : (defaultStartTime ?? "10:00")
  );
  const [endTime, setEndTime] = useState(
    editingBooking ? formatInputTime(editingBooking.endTime) : (defaultEndTime ?? "11:00")
  );
  const [topic, setTopic] = useState(editingBooking?.topic ?? "");
  const [participants, setParticipants] = useState<BookingUserSummary[]>(editingBooking?.participants ?? []);
  const [repeatFrequency, setRepeatFrequency] = useState<"" | "DAILY" | "WEEKLY">("");
  const [repeatUntil, setRepeatUntil] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [skippedDates, setSkippedDates] = useState<string[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedRoom = rooms.find((r) => r.id === roomId);
  const capacityExceeded = useMemo(
    () => !!selectedRoom && participants.length + 1 > selectedRoom.capacity,
    [selectedRoom, participants.length]
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSkippedDates(null);

    const parsed = createBookingSchema.safeParse({
      roomId,
      topic,
      startTime: new Date(`${date}T${startTime}:00`),
      endTime: new Date(`${date}T${endTime}:00`),
      participantIds: participants.map((p) => p.id),
      recurrence:
        !isEditing && repeatFrequency && repeatUntil
          ? { frequency: repeatFrequency, until: new Date(`${repeatUntil}T${endTime}:00`) }
          : undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? dict.modal.genericValidationError);
      return;
    }

    setIsSubmitting(true);
    const res = await fetch(isEditing ? `/api/bookings/${editingBooking.id}` : "/api/bookings", {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setIsSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? (isEditing ? dict.modal.updateFailed : dict.modal.createFailed));
      return;
    }

    const body = await res.json().catch(() => null);
    if (body?.skipped?.length > 0) {
      setSkippedDates(body.skipped.map((s: { date: string }) => new Date(s.date).toLocaleDateString("ru-RU")));
      return;
    }

    onCreated();
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {isEditing ? dict.modal.editTitle : dict.modal.title}
        </h2>

        {skippedDates ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              {dict.modal.recurrence.skippedSummary}: {skippedDates.join(", ")}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onCreated}
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                {dict.modal.close}
              </button>
            </div>
          </div>
        ) : (
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

            {capacityExceeded && selectedRoom && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                {dict.modal.capacityWarning.replace("{count}", String(participants.length + 1)).replace(
                  "{capacity}",
                  String(selectedRoom.capacity)
                )}
              </p>
            )}

            {!isEditing && (
              <div className="rounded-md border border-gray-200 p-3">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {dict.modal.recurrence.label}
                </label>
                <select
                  value={repeatFrequency}
                  onChange={(e) => setRepeatFrequency(e.target.value as "" | "DAILY" | "WEEKLY")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">{dict.modal.recurrence.none}</option>
                  <option value="DAILY">{dict.modal.recurrence.daily}</option>
                  <option value="WEEKLY">{dict.modal.recurrence.weekly}</option>
                </select>
                {repeatFrequency && (
                  <div className="mt-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {dict.modal.recurrence.until}
                    </label>
                    <input
                      type="date"
                      value={repeatUntil}
                      onChange={(e) => setRepeatUntil(e.target.value)}
                      min={date}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      required
                    />
                  </div>
                )}
              </div>
            )}

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
                {isSubmitting
                  ? isEditing
                    ? dict.modal.saving
                    : dict.modal.submitting
                  : isEditing
                    ? dict.modal.save
                    : dict.modal.submit}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function formatInputTime(isoDate: string): string {
  const d = new Date(isoDate);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
