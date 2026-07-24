"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Department } from "@prisma/client";
import type { Dictionary, Locale } from "@/lib/i18n";
import { useWorkplaces } from "@/lib/hooks/use-workplaces";
import { WorkplaceSearch } from "@/components/org-structure/workplace-search";
import { WorkplaceFilters } from "@/components/org-structure/workplace-filters";
import { WorkplaceTable, type WorkplaceSortField, type SortDir } from "@/components/org-structure/workplace-table";
import { WorkplaceCard } from "@/components/org-structure/workplace-card";
import type { EmployeeWithDepartmentAndPosition, Workplace } from "@/types/workplace";

const SORT_FIELDS: WorkplaceSortField[] = [
  "fullName",
  "department",
  "building",
  "floor",
  "room",
  "deskNumber",
];

export function WorkplaceExplorer({
  canEdit,
  departments,
  locale,
  dict,
}: {
  canEdit: boolean;
  departments: Department[];
  locale: Locale;
  dict: Dictionary["workplaces"];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const floor = searchParams.get("floor") ?? "";
  const building = searchParams.get("building") ?? "";
  const departmentId = searchParams.get("departmentId") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const sortParam = searchParams.get("sort");
  const sort: WorkplaceSortField = SORT_FIELDS.includes(sortParam as WorkplaceSortField)
    ? (sortParam as WorkplaceSortField)
    : "floor";
  const dir: SortDir = searchParams.get("dir") === "desc" ? "desc" : "asc";

  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithDepartmentAndPosition | null>(
    null
  );
  const [selectedWorkplace, setSelectedWorkplace] = useState<Workplace | null | undefined>(undefined);
  const [cardError, setCardError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const tableQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (floor) params.set("floor", floor);
    if (building) params.set("building", building);
    if (departmentId) params.set("departmentId", departmentId);
    params.set("page", String(page));
    params.set("sort", sort);
    params.set("dir", dir);
    return params.toString();
  }, [floor, building, departmentId, page, sort, dir]);

  const { data, isLoading, error } = useWorkplaces(tableQuery);

  const updateParams = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  function handleQueryChange(next: string) {
    updateParams({ q: next || null });
    if (!next.trim()) {
      setSelectedEmployee(null);
      setSelectedWorkplace(undefined);
      setCardError(null);
    }
  }

  async function handleSelectEmployee(employee: EmployeeWithDepartmentAndPosition) {
    setSelectedEmployee(employee);
    setSelectedWorkplace(undefined);
    setCardError(null);
    const requestId = ++requestIdRef.current;

    try {
      const res = await fetch(`/api/workplaces/${employee.id}`);
      if (requestIdRef.current !== requestId) return;

      if (res.status === 404) {
        setSelectedWorkplace(null);
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setCardError(body?.error ?? dict.loadError);
        setSelectedWorkplace(null);
        return;
      }

      const json: Workplace = await res.json();
      setSelectedWorkplace(json);
    } catch {
      if (requestIdRef.current !== requestId) return;
      setCardError(dict.loadError);
      setSelectedWorkplace(null);
    }
  }

  function handleFilterChange(patch: { floor?: string; building?: string; departmentId?: string }) {
    updateParams({ ...patch, page: null });
  }

  function handleResetFilters() {
    updateParams({ floor: null, building: null, departmentId: null, page: null });
  }

  function handleSortChange(field: WorkplaceSortField) {
    if (field === sort) {
      updateParams({ dir: dir === "asc" ? "desc" : "asc", page: null });
    } else {
      updateParams({ sort: field, dir: "asc", page: null });
    }
  }

  function handlePageChange(nextPage: number) {
    updateParams({ page: nextPage > 1 ? String(nextPage) : null });
  }

  const isSearchMode = q.trim().length > 0 || selectedEmployee !== null;

  return (
    <div className="space-y-4">
      <WorkplaceSearch value={q} onChange={handleQueryChange} onSelect={handleSelectEmployee} dict={dict} />

      {isSearchMode ? (
        selectedEmployee && (
          <WorkplaceCard
            employee={selectedEmployee}
            workplace={selectedWorkplace ?? null}
            isLoading={selectedWorkplace === undefined}
            error={cardError}
            departments={departments}
            canEdit={canEdit}
            locale={locale}
            dict={dict}
            onUpdated={(updated) => setSelectedWorkplace(updated)}
          />
        )
      ) : (
        <>
          <WorkplaceFilters
            departments={departments}
            floors={data?.floors ?? []}
            buildings={data?.buildings ?? []}
            floor={floor}
            building={building}
            departmentId={departmentId}
            onChange={handleFilterChange}
            onReset={handleResetFilters}
            dict={dict.filters}
          />
          <WorkplaceTable
            items={data?.items ?? []}
            total={data?.total ?? 0}
            page={page}
            pageSize={data?.pageSize ?? 20}
            sort={sort}
            dir={dir}
            onSortChange={handleSortChange}
            onPageChange={handlePageChange}
            onResetFilters={handleResetFilters}
            hasActiveFilters={Boolean(floor || building || departmentId)}
            isLoading={isLoading}
            error={error}
            locale={locale}
            dict={dict}
          />
        </>
      )}
    </div>
  );
}
