import { UserPlus } from "lucide-react";
import type { Department, Employee, Position } from "@prisma/client";
import type { Dictionary } from "@/lib/i18n";

type NewHire = Employee & { position: Position; department: Department };

export function NewHiresWidget({
  employees,
  dict,
}: {
  employees: NewHire[];
  dict: Dictionary["home"]["newHires"];
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-brand-600" />
        <h3 className="font-medium text-gray-900">{dict.title}</h3>
      </div>
      {employees.length === 0 ? (
        <p className="text-sm text-gray-500">{dict.empty}</p>
      ) : (
        <ul className="space-y-3">
          {employees.map((employee) => {
            const isRecent =
              !!employee.hireDate && (Date.now() - new Date(employee.hireDate).getTime()) / 86_400_000 <= 30;
            return (
              <li key={employee.id} className="flex items-center gap-3">
                {employee.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={employee.photoUrl}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-full border border-gray-200 object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-500">
                    {employee.fullName.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{employee.fullName}</p>
                  <p className="truncate text-xs text-gray-500">
                    {employee.position.title} · {employee.department.name}
                  </p>
                </div>
                {isRecent && (
                  <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-300">
                    {dict.badge}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
