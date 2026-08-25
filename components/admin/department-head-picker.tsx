"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export interface EmployeeOption {
  id: string;
  fullName: string;
  position: { title: string };
}

export function DepartmentHeadPicker({
  value,
  onChange,
  placeholder = "Введите имя сотрудника...",
}: {
  value: EmployeeOption | null;
  onChange: (employee: EmployeeOption | null) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<EmployeeOption[]>([]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/employees?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal });
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

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-md border border-gray-300 px-3 py-2 text-sm">
        <span>
          {value.fullName} <span className="text-gray-500">· {value.position.title}</span>
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Убрать"
          className="shrink-0 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      {suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {suggestions.map((emp) => (
            <li key={emp.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(emp);
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
  );
}
