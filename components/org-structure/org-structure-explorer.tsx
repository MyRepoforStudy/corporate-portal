"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SearchX } from "lucide-react";
import { findDepartmentNode, type DepartmentNode, type EmployeeWithPosition } from "@/lib/org-tree";
import type { Department } from "@prisma/client";
import type { Dictionary, Locale } from "@/lib/i18n";
import { OrgTree } from "@/components/org-structure/org-tree";
import { DepartmentPanel } from "@/components/org-structure/department-panel";
import { EmployeeCard } from "@/components/org-structure/employee-card";
import { SkeletonCards } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

type SearchResult = EmployeeWithPosition & { department: Department };

export function OrgStructureExplorer({
  tree,
  locale,
  dict,
}: {
  tree: DepartmentNode[];
  locale: Locale;
  dict: Dictionary["orgStructure"];
}) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    () => searchParams.get("department") ?? tree[0]?.id ?? null
  );

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
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
          setResults(await res.json());
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
  }, [query]);

  const selectedNode = selectedId ? findDepartmentNode(tree, selectedId) : null;

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.searchPlaceholder}
          className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {results !== null ? (
        isLoading ? (
          <SkeletonCards count={3} />
        ) : results.length === 0 ? (
          <EmptyState icon={SearchX} text={dict.noResults} />
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((employee) => (
              <div key={employee.id}>
                <p className="mb-1 text-xs text-gray-500">{employee.department.name}</p>
                <EmployeeCard employee={employee} locale={locale} dict={dict.employeeModal} />
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
          <div className="rounded-lg border border-gray-200 bg-white p-2">
            <OrgTree
              tree={tree}
              selectedId={selectedId}
              onSelect={setSelectedId}
              emptyText={dict.empty}
              labels={{ collapse: dict.collapse, expand: dict.expand }}
            />
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <DepartmentPanel node={selectedNode} locale={locale} dict={dict} />
          </div>
        </div>
      )}
    </div>
  );
}
