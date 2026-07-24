"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import type { EmployeeWithDepartmentAndPosition } from "@/types/workplace";
import type { Dictionary } from "@/lib/i18n";

export function WorkplaceSearch({
  value,
  onChange,
  onSelect,
  dict,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (employee: EmployeeWithDepartmentAndPosition) => void;
  dict: Dictionary["workplaces"];
}) {
  const [suggestions, setSuggestions] = useState<EmployeeWithDepartmentAndPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/employees?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          setSuggestions(await res.json());
        }
      } catch {
        // request was aborted by a newer keystroke; ignore
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [value]);

  function handleChange(next: string) {
    setDismissed(false);
    onChange(next);
  }

  function handleSelect(employee: EmployeeWithDepartmentAndPosition) {
    setDismissed(true);
    setSuggestions([]);
    onSelect(employee);
  }

  const showDropdown = value.trim().length > 0 && !dismissed;

  return (
    <div className="relative max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={dict.searchPlaceholder}
        className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      {showDropdown && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          {isLoading ? (
            <p className="px-3 py-2 text-sm text-gray-500">{dict.searching}</p>
          ) : suggestions.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-500">{dict.noEmployeesFound}</p>
          ) : (
            <ul>
              {suggestions.map((employee) => (
                <li key={employee.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(employee)}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    <span className="font-medium text-gray-900">{employee.fullName}</span>{" "}
                    <span className="text-gray-500">· {employee.department.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
