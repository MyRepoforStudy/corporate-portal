"use client";

import { useEffect, useState } from "react";
import { X, Mail, Phone, Building2, Briefcase, CalendarDays, MapPin, Palmtree } from "lucide-react";
import type { Department, Employee, Position, Workplace } from "@prisma/client";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatDateLong } from "@/lib/i18n/format";
import { ClickablePhoto } from "@/components/ui/photo-lightbox";

type EmployeeDetail = Employee & { department: Department; position: Position; workplace: Workplace | null };

export function isCurrentlyOnVacation(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined
): boolean {
  if (!end) return false;
  const now = new Date();
  if (now > new Date(end)) return false;
  if (start && now < new Date(start)) return false;
  return true;
}

/** Full employee detail popup - fetches the rest of the record on mount.
 * Shared by the org-structure employee card and the home page's birthday/
 * new-hire carousels, so "click a person" behaves the same everywhere. */
export function EmployeeDetailModal({
  employeeId,
  fullName,
  positionTitle,
  photoUrl,
  email,
  phone,
  vacationStart,
  vacationEnd,
  locale,
  dict,
  onClose,
}: {
  employeeId: string;
  fullName: string;
  positionTitle: string;
  photoUrl: string | null;
  email: string;
  phone?: string | null;
  vacationStart?: Date | string | null;
  vacationEnd?: Date | string | null;
  locale: Locale;
  dict: Dictionary["orgStructure"]["employeeModal"];
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<EmployeeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetch(`/api/employees/${employeeId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  const onVacation = isCurrentlyOnVacation(vacationStart, vacationEnd);

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
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <ClickablePhoto
              src={photoUrl}
              size={96}
              fallbackText={fullName.charAt(0)}
              className="text-2xl"
              isOpen={isPhotoOpen}
              onOpen={() => setIsPhotoOpen(true)}
              onClose={() => setIsPhotoOpen(false)}
              openLabel={dict.openPhoto}
              closeLabel={dict.close}
            />
            <div>
              <p className="text-lg font-semibold text-gray-900">{fullName}</p>
              <p className="text-sm text-gray-600">{positionTitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
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
              <a href={`mailto:${email}`} className="hover:text-brand-700 dark:hover:text-brand-300">
                {email}
              </a>
            </div>
            {phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                {phone}
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
  );
}
