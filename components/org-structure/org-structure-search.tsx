"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { Department, Employee, Position } from "@prisma/client";
import type { Dictionary } from "@/lib/i18n";

type EmployeeResult = Employee & { department: Department; position: Position };

const MAX_RESULTS = 8;

export function OrgStructureSearch({
  onSelect,
  dict,
}: {
  onSelect: (departmentId: string) => void;
  dict: Pick<Dictionary["orgStructure"], "searchPlaceholder" | "noResults">;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<EmployeeResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
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
          const body: EmployeeResult[] = await res.json();
          setResults(body.slice(0, MAX_RESULTS));
        }
      } catch {
        // aborted by a newer keystroke; ignore
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(employee: EmployeeResult) {
    setIsOpen(false);
    setQuery("");
    onSelect(employee.departmentId);
  }

  const trimmed = query.trim();

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setIsOpen(false);
        }}
        placeholder={dict.searchPlaceholder}
        className="w-full rounded-md border border-gray-300 bg-white text-gray-900 py-1.5 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />

      {isOpen && trimmed && (
        <div className="absolute left-0 top-full z-30 mt-1 max-h-80 w-80 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {isLoading ? (
            <p className="px-3 py-3 text-sm text-gray-500">...</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-gray-500">{dict.noResults}</p>
          ) : (
            results.map((employee) => (
              <button
                key={employee.id}
                type="button"
                onClick={() => handleSelect(employee)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-gray-900">{employee.fullName}</span>
                  <span className="block truncate text-xs text-gray-500">
                    {employee.position.title} · {employee.department.name}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
