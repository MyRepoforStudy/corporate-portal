"use client";

import { useEffect, useState } from "react";
import { Cake, ChevronLeft, ChevronRight } from "lucide-react";
import type { UpcomingBirthday } from "@/lib/birthdays";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatDateLong } from "@/lib/i18n/format";
import { useToast } from "@/components/ui/toast-provider";
import { BirthdayCongratulateModal } from "@/components/home/birthday-congratulate-modal";
import { EmployeeDetailModal } from "@/components/org-structure/employee-detail-modal";

export function BirthdaysWidget({
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
  const [index, setIndex] = useState(0);
  const [congratulateTarget, setCongratulateTarget] = useState<UpcomingBirthday | null>(null);
  const [detailTarget, setDetailTarget] = useState<UpcomingBirthday | null>(null);

  useEffect(() => {
    if (birthdays.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % birthdays.length), 6000);
    return () => clearInterval(timer);
  }, [birthdays.length]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Cake className="h-4 w-4 text-brand-600" />
          <h3 className="font-medium text-gray-900">{dict.title}</h3>
        </div>
        {birthdays.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + birthdays.length) % birthdays.length)}
              aria-label={common.prev}
              className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % birthdays.length)}
              aria-label={common.next}
              className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {birthdays.length === 0 ? (
        <p className="text-sm text-gray-500">{dict.empty}</p>
      ) : (
        <>
          {birthdays.map((b, i) => {
            if (i !== index) return null;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setDetailTarget(b)}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-gray-50"
              >
                {b.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.photoUrl}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-full border border-gray-200 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg font-medium text-gray-500">
                    {b.fullName.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{b.fullName}</p>
                  <p className="truncate text-xs text-gray-500">{b.positionTitle}</p>
                  <p className="truncate text-xs text-gray-500">{formatDateLong(b.nextOccurrence, locale)}</p>
                </div>
              </button>
            );
          })}

          <div className="mt-3 flex items-center justify-between gap-2">
            {birthdays.length > 1 ? (
              <div className="flex gap-1">
                {birthdays.map((b, i) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={b.fullName}
                    className={`h-1.5 w-1.5 rounded-full transition ${i === index ? "bg-brand-600" : "bg-gray-200"}`}
                  />
                ))}
              </div>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => setCongratulateTarget(birthdays[index])}
              className="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-brand-700 hover:border-brand-300 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/40"
            >
              {dict.congratulate}
            </button>
          </div>
        </>
      )}

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
    </div>
  );
}
