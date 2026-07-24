import { Armchair, ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import type { EmployeeWithWorkplace } from "@/types/workplace";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatFloor, formatPageOf } from "@/lib/i18n/format";
import { SkeletonLines } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export type WorkplaceSortField =
  | "fullName"
  | "department"
  | "building"
  | "floor"
  | "room"
  | "deskNumber";
export type SortDir = "asc" | "desc";

const COLUMNS: { field: WorkplaceSortField; labelKey: keyof Dictionary["workplaces"]["table"] }[] = [
  { field: "fullName", labelKey: "fullName" },
  { field: "department", labelKey: "department" },
  { field: "building", labelKey: "building" },
  { field: "floor", labelKey: "floor" },
  { field: "room", labelKey: "room" },
  { field: "deskNumber", labelKey: "deskNumber" },
];

export function WorkplaceTable({
  items,
  total,
  page,
  pageSize,
  sort,
  dir,
  onSortChange,
  onPageChange,
  onResetFilters,
  hasActiveFilters,
  isLoading,
  error,
  locale,
  dict,
}: {
  items: EmployeeWithWorkplace[];
  total: number;
  page: number;
  pageSize: number;
  sort: WorkplaceSortField;
  dir: SortDir;
  onSortChange: (field: WorkplaceSortField) => void;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  isLoading: boolean;
  error: string | null;
  locale: Locale;
  dict: Dictionary["workplaces"];
}) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <SkeletonLines count={6} />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
        <EmptyState icon={Armchair} text={dict.table.empty} />
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-sm text-brand-700 hover:underline dark:text-brand-300"
          >
            {dict.table.resetFilters}
          </button>
        )}
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-3">
      <div className="max-h-[65vh] overflow-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50">
            <tr>
              {COLUMNS.map((col) => (
                <th key={col.field} className="px-4 py-2 font-medium text-gray-500">
                  <button
                    type="button"
                    onClick={() => onSortChange(col.field)}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    {dict.table[col.labelKey]}
                    {sort === col.field &&
                      (dir === "asc" ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ))}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2 text-gray-900">{item.fullName}</td>
                <td className="px-4 py-2 text-gray-600">{item.department.name}</td>
                {item.workplace ? (
                  <>
                    <td className="px-4 py-2 text-gray-600">{item.workplace.building ?? "—"}</td>
                    <td className="px-4 py-2 text-gray-600">
                      {formatFloor(item.workplace.floor, locale)}
                    </td>
                    <td className="px-4 py-2 text-gray-600">{item.workplace.room}</td>
                    <td className="px-4 py-2 text-gray-600">{item.workplace.deskNumber}</td>
                  </>
                ) : (
                  <td colSpan={4} className="px-4 py-2 italic text-gray-500">
                    {dict.notAssigned}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          {dict.table.prev}
        </button>
        <span>{formatPageOf(page, totalPages, locale)}</span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {dict.table.next}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
