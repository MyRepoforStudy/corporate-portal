"use client";

import { useState } from "react";
import { X, Mail, Phone, Building2, CalendarDays, MapPin } from "lucide-react";
import type { Department, Employee, Position, Workplace } from "@prisma/client";
import type { EmployeeWithPosition } from "@/lib/org-tree";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatDateLong } from "@/lib/i18n/format";

type EmployeeDetail = Employee & { department: Department; position: Position; workplace: Workplace | null };

export function EmployeeCard({
  employee,
  locale,
  dict,
  variant = "list",
}: {
  employee: EmployeeWithPosition;
  locale: Locale;
  dict: Dictionary["orgStructure"]["employeeModal"];
  /** "card": centered, fixed-size presentation matching the org chart's department cards. */
  variant?: "list" | "card";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [detail, setDetail] = useState<EmployeeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function handleOpen() {
    setIsOpen(true);
    if (detail || isLoading) return;
    setIsLoading(true);
    fetch(`/api/employees/${employee.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setDetail)
      .finally(() => setIsLoading(false));
  }

  const workplaceText = detail?.workplace
    ? [
        detail.workplace.building,
        `${dict.floor} ${detail.workplace.floor}`,
        detail.workplace.room,
        `${dict.desk} ${detail.workplace.deskNumber}`,
      ]
        .filter(Boolean)
        .join(", ")
    : dict.notAssigned;

  return (
    <>
      {variant === "card" ? (
        <button
          type="button"
          onClick={handleOpen}
          className="chart-node-enter flex w-full flex-col items-center gap-2 rounded-lg border border-gray-200 border-l-4 border-l-brand-600 bg-white px-5 py-3 text-center transition hover:-translate-y-0.5 hover:shadow-sm"
        >
          {employee.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={employee.photoUrl}
              alt=""
              className="h-11 w-11 shrink-0 rounded-full border border-gray-200 object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 font-medium text-gray-500">
              {employee.fullName.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900" style={{ maxWidth: 180 }}>
              {employee.fullName}
            </p>
            <p className="truncate text-xs text-gray-500" style={{ maxWidth: 180 }}>
              {employee.position.title}
            </p>
          </div>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          className="flex w-full gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left text-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-sm"
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
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-900">{employee.fullName}</p>
            <p className="text-gray-600">{employee.position.title}</p>
            <div className="mt-1 space-y-0.5 text-gray-500">
              <p className="truncate">{employee.email}</p>
              {employee.phone && <p>{employee.phone}</p>}
            </div>
          </div>
        </button>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-4">
                {employee.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={employee.photoUrl}
                    alt=""
                    className="h-20 w-20 shrink-0 rounded-full border border-gray-200 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gray-100 text-2xl font-medium text-gray-500">
                    {employee.fullName.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-lg font-semibold text-gray-900">{employee.fullName}</p>
                  <p className="text-sm text-gray-600">{employee.position.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Закрыть"
                className="shrink-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {isLoading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-4 animate-pulse rounded bg-gray-100" style={{ width: `${80 - i * 10}%` }} />
                ))}
              </div>
            ) : (
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                  <a href={`mailto:${employee.email}`} className="hover:text-brand-700 dark:hover:text-brand-300">
                    {employee.email}
                  </a>
                </div>
                {employee.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                    {employee.phone}
                  </div>
                )}
                {detail?.department && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building2 className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                    {detail.department.name}
                  </div>
                )}
                {detail?.hireDate && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <CalendarDays className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                    {dict.hireDate}: {formatDateLong(detail.hireDate, locale, true)}
                  </div>
                )}
                {detail && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                    {workplaceText}
                  </div>
                )}
              </dl>
            )}
          </div>
        </div>
      )}
    </>
  );
}
