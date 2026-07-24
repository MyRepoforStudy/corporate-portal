"use client";

import { useState, type FormEvent } from "react";
import { workplaceSchema } from "@/lib/validations/workplace";
import type { Workplace } from "@/types/workplace";
import type { Dictionary } from "@/lib/i18n";

export function WorkplaceEditModal({
  employeeId,
  employeeFullName,
  workplace,
  dict,
  onClose,
  onSaved,
}: {
  employeeId: string;
  employeeFullName: string;
  workplace: Workplace | null;
  dict: Dictionary["workplaces"]["modal"];
  onClose: () => void;
  onSaved: (workplace: Workplace) => void;
}) {
  const [building, setBuilding] = useState(workplace?.building ?? "");
  const [floor, setFloor] = useState(workplace ? String(workplace.floor) : "");
  const [room, setRoom] = useState(workplace?.room ?? "");
  const [deskNumber, setDeskNumber] = useState(workplace?.deskNumber ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = workplaceSchema.safeParse({ building, floor, room, deskNumber });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? dict.genericValidationError);
      return;
    }

    setIsSubmitting(true);
    const res = await fetch(`/api/workplaces/${employeeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setIsSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? dict.updateFailed);
      return;
    }

    const updated: Workplace = await res.json();
    onSaved(updated);
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">{dict.title}</h2>
        <p className="mb-4 text-sm text-gray-500">{employeeFullName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{dict.building}</label>
            <input
              type="text"
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{dict.floor}</label>
            <input
              type="number"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{dict.room}</label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{dict.deskNumber}</label>
            <input
              type="text"
              value={deskNumber}
              onChange={(e) => setDeskNumber(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              {dict.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {isSubmitting ? dict.saving : dict.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
