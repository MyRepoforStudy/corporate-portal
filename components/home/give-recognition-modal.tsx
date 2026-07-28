"use client";

import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

interface EmployeeOption {
  id: string;
  fullName: string;
  position: { title: string };
}

export function GiveRecognitionModal({
  onClose,
  onCreated,
  dict,
}: {
  onClose: () => void;
  onCreated: () => void;
  dict: Dictionary["home"]["recognitions"];
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<EmployeeOption[]>([]);
  const [selected, setSelected] = useState<EmployeeOption | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/employees?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (res.ok) setSuggestions(await res.json());
      } catch {
        // request superseded by a newer keystroke
      }
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!selected) {
      setError(dict.selectEmployee);
      return;
    }
    setIsSubmitting(true);
    const res = await fetch("/api/recognitions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toEmployeeId: selected.id, title, message }),
    });
    setIsSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? dict.createFailed);
      return;
    }
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{dict.modalTitle}</h2>
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
            <label className="mb-1 block text-sm font-medium text-gray-700">{dict.toLabel}</label>
            {selected ? (
              <div className="flex items-center justify-between rounded-md border border-gray-300 px-3 py-2 text-sm">
                <span>
                  {selected.fullName} <span className="text-gray-500">· {selected.position.title}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label={dict.close}
                  className="shrink-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={dict.searchPlaceholder}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                {suggestions.length > 0 && (
                  <ul className="absolute z-10 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                    {suggestions.map((emp) => (
                      <li key={emp.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(emp);
                            setQuery("");
                            setSuggestions([]);
                          }}
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          <span className="font-medium">{emp.fullName}</span>{" "}
                          <span className="text-gray-500">· {emp.position.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{dict.titleLabel}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={dict.titlePlaceholder}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{dict.messageLabel}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
              {isSubmitting ? dict.submitting : dict.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
