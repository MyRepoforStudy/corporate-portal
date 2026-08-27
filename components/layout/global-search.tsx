"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, DoorOpen, Search, User } from "lucide-react";
import type { Department, Employee, Position, Room } from "@prisma/client";
import type { Dictionary } from "@/lib/i18n";

interface SearchResponse {
  employees: (Employee & { department: Department; position: Position })[];
  departments: Department[];
  rooms: Room[];
}

const EMPTY: SearchResponse = { employees: [], departments: [], rooms: [] };

export function GlobalSearch({ dict }: { dict: Dictionary["search"] }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResponse>(EMPTY);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(EMPTY);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          setResults(await res.json());
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

  function goTo(url: string) {
    setIsOpen(false);
    setQuery("");
    router.push(url);
  }

  const trimmed = query.trim();
  const hasQuery = trimmed.length >= 2;
  const hasResults = results.employees.length > 0 || results.departments.length > 0 || results.rooms.length > 0;

  return (
    <div ref={containerRef} className="relative hidden w-64 sm:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setIsOpen(false);
        }}
        placeholder={dict.placeholder}
        className="w-full rounded-full border border-gray-300 bg-white text-gray-900 py-1.5 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />

      {isOpen && hasQuery && (
        <div className="absolute left-0 top-full z-30 mt-1 max-h-96 w-80 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {isLoading ? (
            <p className="px-3 py-3 text-sm text-gray-500">...</p>
          ) : !hasResults ? (
            <p className="px-3 py-3 text-sm text-gray-500">{dict.noResults}</p>
          ) : (
            <>
              {results.employees.length > 0 && (
                <div>
                  <p className="bg-gray-50 px-3 py-1.5 text-xs text-gray-500">{dict.employees}</p>
                  {results.employees.map((employee) => (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() => goTo(`/org-structure/${employee.department.id}`)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      <User className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block truncate text-gray-900">{employee.fullName}</span>
                        <span className="block truncate text-xs text-gray-500">
                          {employee.position.title} · {employee.department.name}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {results.departments.length > 0 && (
                <div>
                  <p className="bg-gray-50 px-3 py-1.5 text-xs text-gray-500">{dict.departments}</p>
                  {results.departments.map((department) => (
                    <button
                      key={department.id}
                      type="button"
                      onClick={() => goTo(`/org-structure/${department.id}`)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      <Building2 className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                      <span className="truncate text-gray-900">{department.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.rooms.length > 0 && (
                <div>
                  <p className="bg-gray-50 px-3 py-1.5 text-xs text-gray-500">{dict.rooms}</p>
                  {results.rooms.map((room) => (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => goTo(`/bookings?room=${room.id}`)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      <DoorOpen className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                      <span className="truncate text-gray-900">{room.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
