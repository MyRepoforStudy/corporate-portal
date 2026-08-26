import { Users } from "lucide-react";
import type { EmployeeWithPosition } from "@/lib/org-tree";
import type { Dictionary, Locale } from "@/lib/i18n";
import { EmployeeCard } from "@/components/org-structure/employee-card";
import { EmptyState } from "@/components/ui/empty-state";

export function TeamSection({
  colleagues,
  locale,
  dict,
  title,
  emptyText,
}: {
  colleagues: EmployeeWithPosition[];
  locale: Locale;
  dict: Dictionary["orgStructure"]["employeeModal"];
  title: string;
  emptyText: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="mb-3 font-medium text-gray-900">{title}</h2>
      {colleagues.length === 0 ? (
        <EmptyState icon={Users} text={emptyText} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {colleagues.map((colleague) => (
            <EmployeeCard key={colleague.id} employee={colleague} locale={locale} dict={dict} />
          ))}
        </div>
      )}
    </div>
  );
}
