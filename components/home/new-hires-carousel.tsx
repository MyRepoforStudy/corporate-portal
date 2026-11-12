"use client";

import { useState } from "react";
import type { Department, Employee, Position } from "@prisma/client";
import type { Dictionary, Locale } from "@/lib/i18n";
import { EmployeeDetailModal } from "@/components/org-structure/employee-detail-modal";
import { CarouselPager, useCarousel } from "@/components/home/carousel";

export type NewHire = Employee & { position: Position; department: Department };

/** One new colleague at a time (it moves on by itself). The "new employees" tab of PeopleWidget. */
export function NewHiresCarousel({
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
  const { active, select, next, prev } = useCarousel(employees.length);
  const [detailTarget, setDetailTarget] = useState<NewHire | null>(null);

  if (employees.length === 0) {
    return <p className="text-sm text-gray-500">{dict.empty}</p>;
  }

  const current = employees[active];
  const isRecent =
    !!current.hireDate && (Date.now() - new Date(current.hireDate).getTime()) / 86_400_000 <= 30;

  return (
    <>
      <button
        key={current.id}
        type="button"
        onClick={() => setDetailTarget(current)}
        className="slide-enter flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-gray-50"
      >
        {current.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.photoUrl}
            alt=""
            className="h-16 w-16 shrink-0 rounded-full border border-gray-200 object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg font-medium text-gray-500">
            {current.fullName.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">{current.fullName}</p>
          <p className="truncate text-xs text-gray-500">
            {current.position.title} · {current.department.name}
          </p>
        </div>
      </button>

      {(employees.length > 1 || isRecent) && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <CarouselPager
            count={employees.length}
            active={active}
            onSelect={select}
            onPrev={prev}
            onNext={next}
            prevLabel={common.prev}
            nextLabel={common.next}
            dotLabel={(i) => employees[i].fullName}
          />
          {isRecent && (
            <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-300">
              {dict.badge}
            </span>
          )}
        </div>
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
    </>
  );
}
