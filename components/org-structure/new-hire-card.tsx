import type { Employee, Position, Department } from "@prisma/client";
import { EmployeeCard } from "@/components/org-structure/employee-card";
import { formatDateLong } from "@/lib/i18n/format";
import type { Dictionary, Locale } from "@/lib/i18n";

type NewHire = Employee & { position: Position; department: Department };

export function NewHireCard({
  employee,
  locale,
  dict,
}: {
  employee: NewHire;
  locale: Locale;
  dict: Dictionary["orgStructure"];
}) {
  const isRecent =
    !!employee.hireDate && (Date.now() - new Date(employee.hireDate).getTime()) / 86_400_000 <= 30;

  return (
    <div className="relative">
      {isRecent && (
        <span className="absolute -right-1.5 -top-1.5 z-10 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-medium text-white shadow-sm">
          {dict.newHires.newBadge}
        </span>
      )}
      <div className="mb-1 flex items-center justify-between gap-2 text-xs text-gray-500">
        <span className="truncate">{employee.department.name}</span>
        {employee.hireDate && (
          <span className="shrink-0">
            {dict.newHires.hiredOn} {formatDateLong(employee.hireDate, locale)}
          </span>
        )}
      </div>
      <EmployeeCard employee={employee} locale={locale} dict={dict.employeeModal} />
    </div>
  );
}
