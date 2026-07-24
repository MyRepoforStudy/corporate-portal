import { collectEmployees, collectVacancies, type DepartmentNode } from "@/lib/org-tree";
import { EmployeeCard } from "@/components/org-structure/employee-card";
import { VacancyCard } from "@/components/org-structure/vacancy-card";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatEmployeesCount } from "@/lib/i18n/format";

export function DepartmentPanel({
  node,
  locale,
  dict,
}: {
  node: DepartmentNode | null;
  locale: Locale;
  dict: Dictionary["orgStructure"];
}) {
  if (!node) {
    return <p className="text-sm text-gray-500">{dict.selectDepartment}</p>;
  }

  const employees = collectEmployees(node);
  const vacancies = collectVacancies(node);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 font-medium text-gray-900">
          {node.name}
          <span className="ml-2 text-sm font-normal text-gray-500">
            {formatEmployeesCount(employees.length, locale)}
          </span>
        </h3>
        {employees.length === 0 ? (
          <p className="text-sm text-gray-500">{dict.noEmployeesInDept}</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {employees.map((employee) => (
              <EmployeeCard key={employee.id} employee={employee} locale={locale} dict={dict.employeeModal} />
            ))}
          </div>
        )}
      </div>

      {vacancies.length > 0 && (
        <div>
          <h3 className="mb-3 font-medium text-gray-900">
            {dict.vacanciesTitle}
            <span className="ml-2 text-sm font-normal text-gray-500">{vacancies.length}</span>
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {vacancies.map((vacancy) => (
              <VacancyCard key={vacancy.id} vacancy={vacancy} label={dict.vacancyLabel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
