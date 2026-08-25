"use client";

import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

export function BirthdayCongratulateModal({
  toEmployeeId,
  toName,
  dict,
  onClose,
  onSent,
}: {
  toEmployeeId: string;
  toName: string;
  dict: Dictionary["home"]["birthdays"]["modal"];
  onClose: () => void;
  onSent: () => void;
}) {
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSending(true);

    const res = await fetch("/api/birthdays/congratulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toEmployeeId, message, anonymous }),
    });
    setIsSending(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? dict.sendFailed);
      return;
    }

    onSent();
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {dict.title} — {toName}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={dict.close}
            className="shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{dict.messageLabel}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={dict.messagePlaceholder}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
            {dict.anonymousLabel}
          </label>
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
              disabled={isSending}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {isSending ? dict.sending : dict.send}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
