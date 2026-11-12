"use client";

import { useState } from "react";
import type { UpcomingBirthday } from "@/lib/birthdays";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatDateLong } from "@/lib/i18n/format";
import { useToast } from "@/components/ui/toast-provider";
import { BirthdayCongratulateModal } from "@/components/home/birthday-congratulate-modal";
import { EmployeeDetailModal } from "@/components/org-structure/employee-detail-modal";
import { CarouselPager, useCarousel } from "@/components/home/carousel";

/** One upcoming birthday at a time (it moves on by itself). The "birthdays" tab of PeopleWidget. */
export function BirthdaysCarousel({
  birthdays,
  locale,
  dict,
  employeeModalDict,
  common,
}: {
  birthdays: UpcomingBirthday[];
  locale: Locale;
  dict: Dictionary["home"]["birthdays"];
  employeeModalDict: Dictionary["orgStructure"]["employeeModal"];
  common: Dictionary["common"];
}) {
  const showToast = useToast();
  const { active, select, next, prev } = useCarousel(birthdays.length);
  const [congratulateTarget, setCongratulateTarget] = useState<UpcomingBirthday | null>(null);
  const [detailTarget, setDetailTarget] = useState<UpcomingBirthday | null>(null);

  if (birthdays.length === 0) {
    return <p className="text-sm text-gray-500">{dict.empty}</p>;
  }

  const current = birthdays[active];

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
          <p className="truncate text-xs text-gray-500">{current.positionTitle}</p>
          <p className="truncate text-xs text-gray-500">{formatDateLong(current.occurrence, locale)}</p>
        </div>
      </button>

      <div className="mt-3 flex items-center justify-between gap-2">
        <CarouselPager
          count={birthdays.length}
          active={active}
          onSelect={select}
          onPrev={prev}
          onNext={next}
          prevLabel={common.prev}
          nextLabel={common.next}
          dotLabel={(i) => birthdays[i].fullName}
        />
        <button
          type="button"
          onClick={() => setCongratulateTarget(current)}
          className="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-brand-700 hover:border-brand-300 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/40"
        >
          {dict.congratulate}
        </button>
      </div>

      {congratulateTarget && (
        <BirthdayCongratulateModal
          toEmployeeId={congratulateTarget.id}
          toName={congratulateTarget.fullName}
          dict={dict.modal}
          onClose={() => setCongratulateTarget(null)}
          onSent={() => {
            setCongratulateTarget(null);
            showToast(dict.modal.sentSuccess, "success");
          }}
        />
      )}

      {detailTarget && (
        <EmployeeDetailModal
          employeeId={detailTarget.id}
          fullName={detailTarget.fullName}
          positionTitle={detailTarget.positionTitle}
          photoUrl={detailTarget.photoUrl}
          email={detailTarget.email}
          phone={detailTarget.phone}
          locale={locale}
          dict={employeeModalDict}
          onClose={() => setDetailTarget(null)}
        />
      )}
    </>
  );
}
