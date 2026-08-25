"use client";

import { useState } from "react";
import { Palmtree } from "lucide-react";
import type { EmployeeWithPosition } from "@/lib/org-tree";
import type { Dictionary, Locale } from "@/lib/i18n";
import { ClickablePhoto } from "@/components/ui/photo-lightbox";
import { EmployeeDetailModal, isCurrentlyOnVacation } from "@/components/org-structure/employee-detail-modal";

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
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);

  const onVacation = isCurrentlyOnVacation(employee.vacationStart, employee.vacationEnd);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
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
        <EmployeeDetailModal
          employeeId={employee.id}
          fullName={employee.fullName}
          positionTitle={employee.position.title}
          photoUrl={employee.photoUrl}
          email={employee.email}
          phone={employee.phone}
          vacationStart={employee.vacationStart}
          vacationEnd={employee.vacationEnd}
          locale={locale}
          dict={dict}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
