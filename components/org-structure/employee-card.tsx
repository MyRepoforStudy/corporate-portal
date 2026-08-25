"use client";

import { useState } from "react";
import { X, Mail, Phone, Building2, Briefcase, CalendarDays, MapPin, Palmtree } from "lucide-react";
import type { Department, Employee, Position, Workplace } from "@prisma/client";
import type { EmployeeWithPosition } from "@/lib/org-tree";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatDateLong } from "@/lib/i18n/format";
import { ClickablePhoto } from "@/components/ui/photo-lightbox";

type EmployeeDetail = Employee & { department: Department; position: Position; workplace: Workplace | null };

function isCurrentlyOnVacation(start: Date | string | null | undefined, end: Date | string | null | undefined): boolean {
  if (!end) return false;
  const now = new Date();
  if (now > new Date(end)) return false;
  if (start && now < new Date(start)) return false;
  return true;
}

export function EmployeeCard({
  employee,
  locale,
  dict,
}: {
  employee: EmployeeWithPosition;
  locale: Locale;
  dict: Dictionary["orgStructure"]["employeeModal"];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [detail, setDetail] = useState<EmployeeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);

  function handleOpen() {
    setIsOpen(true);
    if (detail || isLoading) return;
    setIsLoading(true);
    fetch(`/api/employees/${employee.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setDetail)
      .finally(() => setIsLoading(false));
  }

  const onVacation = isCurrentlyOnVacation(employee.vacationStart, employee.vacationEnd);

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
      <button
        type="button"
        onClick={handleOpen}
        className="flex w-full gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left text-sm transition hover:border-brand-300 hover:shadow-sm"
      >
        <ClickablePhoto
          src={employee.photoUrl}
          size={80}
          fallbackText={employee.fullName.charAt(0)}
          className="text-lg"
          isOpen={isPhotoOpen}
          onOpen={() => setIsPhotoOpen(true)}
          onClose={() => setIsPhotoOpen(false)}
          openLabel={dict.openPhoto}
          closeLabel={dict.close}
        />
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900">{employee.fullName}</p>
          <p className="text-gray-600">{employee.position.title}</p>
          {onVacation && (
            <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              <Palmtree className="h-2.5 w-2.5" aria-hidden="true" />
              {dict.onVacation}
            </span>
          )}
          <div className="mt-1 space-y-0.5 text-gray-500">
            <p className="truncate">{employee.email}</p>
            {employee.phone && <p>{employee.phone}</p>}
          </div>
        </div>
      </button>

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
                <ClickablePhoto
                  src={employee.photoUrl}
                  size={96}
                  fallbackText={employee.fullName.charAt(0)}
                  className="text-2xl"
                  isOpen={isPhotoOpen}
                  onOpen={() => setIsPhotoOpen(true)}
                  onClose={() => setIsPhotoOpen(false)}
                />
                <div>
                  <p className="text-lg font-semibold text-gray-900">{employee.fullName}</p>
                  <p className="text-sm text-gray-600">{employee.position.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label={dict.close}
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
                {detail?.vacationEnd && onVacation && (
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                    <Palmtree className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {dict.onVacationUntil.replace("{date}", formatDateLong(detail.vacationEnd, locale, true))}
                  </div>
                )}
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
                {detail?.activityArea && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Briefcase className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                    {detail.activityArea}
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
