"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { BookingUserSummary } from "@/types/booking";
import type { Dictionary } from "@/lib/i18n";

export function ParticipantPicker({
  selected,
  onChange,
  dict,
}: {
  selected: BookingUserSummary[];
  onChange: (users: BookingUserSummary[]) => void;
  dict: Dictionary["bookings"]["participants"];
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<BookingUserSummary[]>([]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (res.ok) setSuggestions(await res.json());
      } catch {
        // ignore aborted requests
      }
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  function addUser(user: BookingUserSummary) {
    if (!selected.some((u) => u.id === user.id)) {
      onChange([...selected, user]);
    }
    setQuery("");
    setSuggestions([]);
  }

  function removeUser(id: string) {
    onChange(selected.filter((u) => u.id !== id));
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{dict.label}</label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.searchPlaceholder}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
            {suggestions.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  onClick={() => addUser(user)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  <span className="font-medium">{user.displayName}</span>{" "}
                  <span className="text-gray-500">{user.email}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((user) => (
            <span
              key={user.id}
              className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs text-brand-800 dark:bg-brand-900/40 dark:text-brand-200"
            >
              {user.displayName}
              <button type="button" onClick={() => removeUser(user.id)} aria-label={`Убрать ${user.displayName}`}>
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
