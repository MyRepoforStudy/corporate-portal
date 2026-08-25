"use client";

import { useState } from "react";
import { Cake } from "lucide-react";
import type { UpcomingBirthday } from "@/lib/birthdays";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatDateLong } from "@/lib/i18n/format";
import { useToast } from "@/components/ui/toast-provider";
import { BirthdayCongratulateModal } from "@/components/home/birthday-congratulate-modal";

export function BirthdaysWidget({
  birthdays,
  locale,
  dict,
}: {
  birthdays: UpcomingBirthday[];
  locale: Locale;
  dict: Dictionary["home"]["birthdays"];
}) {
  const showToast = useToast();
  const [target, setTarget] = useState<UpcomingBirthday | null>(null);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Cake className="h-4 w-4 text-brand-600" />
        <h3 className="font-medium text-gray-900">{dict.title}</h3>
      </div>
      {birthdays.length === 0 ? (
        <p className="text-sm text-gray-500">{dict.empty}</p>
      ) : (
        <ul className="space-y-3">
          {birthdays.map((b) => (
            <li key={b.id} className="flex items-center gap-3">
              {b.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={b.photoUrl}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-full border border-gray-200 object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-500">
                  {b.fullName.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{b.fullName}</p>
                <p className="truncate text-xs text-gray-500">
                  {b.positionTitle} · {formatDateLong(b.nextOccurrence, locale)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTarget(b)}
                className="shrink-0 rounded-md border border-gray-200 px-2.5 py-1 text-xs text-brand-700 hover:border-brand-300 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/40"
              >
                {dict.congratulate}
              </button>
            </li>
          ))}
        </ul>
      )}

      {target && (
        <BirthdayCongratulateModal
          toEmployeeId={target.id}
          toName={target.fullName}
          dict={dict.modal}
          onClose={() => setTarget(null)}
          onSent={() => {
            setTarget(null);
            showToast(dict.modal.sentSuccess, "success");
          }}
        />
      )}
    </div>
  );
}
