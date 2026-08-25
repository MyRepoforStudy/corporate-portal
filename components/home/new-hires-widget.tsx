"use client";

import { useEffect, useState } from "react";
import { UserPlus, ChevronLeft, ChevronRight } from "lucide-react";
import type { Department, Employee, Position } from "@prisma/client";
import type { Dictionary, Locale } from "@/lib/i18n";
import { EmployeeDetailModal } from "@/components/org-structure/employee-detail-modal";

type NewHire = Employee & { position: Position; department: Department };

export function NewHiresWidget({
  employees,
  locale,
  dict,
  employeeModalDict,
  common,
}: {
  employees: NewHire[];
  locale: Locale;
  dict: Dictionary["home"]["newHires"];
  employeeModalDict: Dictionary["orgStructure"]["employeeModal"];
  common: Dictionary["common"];
}) {
  const [index, setIndex] = useState(0);
  const [detailTarget, setDetailTarget] = useState<NewHire | null>(null);

  useEffect(() => {
    if (employees.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % employees.length), 6000);
    return () => clearInterval(timer);
  }, [employees.length]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-brand-600" />
          <h3 className="font-medium text-gray-900">{dict.title}</h3>
        </div>
        {employees.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + employees.length) % employees.length)}
              aria-label={common.prev}
              className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % employees.length)}
              aria-label={common.next}
              className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {employees.length === 0 ? (
        <p className="text-sm text-gray-500">{dict.empty}</p>
      ) : (
        <>
          {employees.map((employee, i) => {
            if (i !== index) return null;
            const isRecent =
              !!employee.hireDate && (Date.now() - new Date(employee.hireDate).getTime()) / 86_400_000 <= 30;
            return (
              <button
                key={employee.id}
                type="button"
                onClick={() => setDetailTarget(employee)}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-gray-50"
              >
                {employee.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={employee.photoUrl}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-full border border-gray-200 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg font-medium text-gray-500">
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
              </button>
            );
          })}

          {employees.length > 1 && (
            <div className="mt-3 flex gap-1">
              {employees.map((employee, i) => (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={employee.fullName}
                  className={`h-1.5 w-1.5 rounded-full transition ${i === index ? "bg-brand-600" : "bg-gray-200"}`}
                />
              ))}
            </div>
          )}
        </>
      )}

      {detailTarget && (
        <EmployeeDetailModal
          employeeId={detailTarget.id}
          fullName={detailTarget.fullName}
          positionTitle={detailTarget.position.title}
          photoUrl={detailTarget.photoUrl}
          email={detailTarget.email}
          phone={detailTarget.phone}
          vacationStart={detailTarget.vacationStart}
          vacationEnd={detailTarget.vacationEnd}
          locale={locale}
          dict={employeeModalDict}
          onClose={() => setDetailTarget(null)}
        />
      )}
    </div>
  );
}
