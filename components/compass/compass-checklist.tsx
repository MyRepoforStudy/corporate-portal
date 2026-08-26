"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

interface ChecklistItem {
  id: string;
  label: string;
  href: string;
}

export function CompassChecklist({
  userId,
  items,
  title,
}: {
  userId: string;
  items: ChecklistItem[];
  title: string;
}) {
  const storageKey = `compass-checklist-${userId}`;
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setChecked(JSON.parse(raw));
    } catch {
      // storage unavailable (private mode, blocked site data, etc.)
    }
  }, [storageKey]);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // keep in-memory only if storage is unavailable
      }
      return next;
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-3 font-medium text-gray-900">{title}</h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => toggle(item.id)}
              aria-pressed={!!checked[item.id]}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                checked[item.id]
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-gray-300 text-transparent hover:border-brand-400"
              }`}
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <Link
              href={item.href}
              className={`text-sm transition hover:text-brand-700 dark:hover:text-brand-300 ${
                checked[item.id] ? "text-gray-400 line-through" : "text-gray-700"
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
