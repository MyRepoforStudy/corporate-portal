import type { Department } from "@prisma/client";
import { getDepartmentPath } from "@/lib/org-tree";
import { formatFloor } from "@/lib/i18n/format";
import { WorkplaceEditButton } from "@/components/org-structure/workplace-edit-button";
import { SkeletonLines } from "@/components/ui/skeleton";
import type { EmployeeWithDepartmentAndPosition, Workplace } from "@/types/workplace";
import type { Dictionary, Locale } from "@/lib/i18n";

export function WorkplaceCard({
  employee,
  workplace,
  isLoading,
  error,
  departments,
  canEdit,
  locale,
  dict,
  onUpdated,
}: {
  employee: EmployeeWithDepartmentAndPosition;
  workplace: Workplace | null;
  isLoading: boolean;
  error: string | null;
  departments: Department[];
  canEdit: boolean;
  locale: Locale;
  dict: Dictionary["workplaces"];
  onUpdated: (workplace: Workplace) => void;
}) {
  const path = getDepartmentPath(departments, employee.departmentId);

  return (
    <div className="max-w-md rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900">{employee.fullName}</p>
          <p className="text-sm text-gray-600">{employee.position.title}</p>
          {path.length > 0 && (
            <p className="mt-1 truncate text-xs text-gray-500">
              {path.map((d) => d.name).join(" / ")}
            </p>
          )}
        </div>
        {canEdit && !isLoading && (
          <WorkplaceEditButton
            employeeId={employee.id}
            employeeFullName={employee.fullName}
            workplace={workplace}
            editLabel={dict.editAction}
            dict={dict.modal}
            onSaved={onUpdated}
          />
        )}
      </div>

      <div className="mt-3 border-t border-gray-100 pt-3 text-sm">
        {isLoading ? (
          <SkeletonLines count={3} />
        ) : error ? (
          <p className="text-red-600 dark:text-red-400">{error}</p>
        ) : workplace ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-gray-700">
            {workplace.building && (
              <>
                <dt className="text-gray-500">{dict.card.building}</dt>
                <dd>{workplace.building}</dd>
              </>
            )}
            <dt className="text-gray-500">{dict.card.floor}</dt>
            <dd>{formatFloor(workplace.floor, locale)}</dd>
            <dt className="text-gray-500">{dict.card.room}</dt>
            <dd>{workplace.room}</dd>
            <dt className="text-gray-500">{dict.card.deskNumber}</dt>
            <dd>{workplace.deskNumber}</dd>
          </dl>
        ) : (
          <p className="text-gray-500">{dict.notAssigned}</p>
        )}
      </div>
    </div>
  );
}
