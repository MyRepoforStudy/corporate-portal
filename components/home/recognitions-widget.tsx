"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Award, Plus } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatDateLong } from "@/lib/i18n/format";
import { GiveRecognitionModal } from "@/components/home/give-recognition-modal";

export interface RecognitionItem {
  id: string;
  title: string;
  message: string | null;
  createdAt: string | Date;
  fromEmployee: { id: string; fullName: string; photoUrl: string | null };
  toEmployee: { id: string; fullName: string; photoUrl: string | null };
}

export function RecognitionsWidget({
  recognitions,
  locale,
  dict,
  canGive,
}: {
  recognitions: RecognitionItem[];
  locale: Locale;
  dict: Dictionary["home"]["recognitions"];
  canGive: boolean;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div id="recognitions" className="rounded-lg border border-gray-200 bg-white p-4 scroll-mt-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-brand-600" />
          <h3 className="font-medium text-gray-900">{dict.title}</h3>
        </div>
        {canGive && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-brand-700 hover:border-brand-300 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/40"
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
            {dict.give}
          </button>
        )}
      </div>

      {recognitions.length === 0 ? (
        <p className="text-sm text-gray-500">{dict.empty}</p>
      ) : (
        <ul className="space-y-3">
          {recognitions.map((r) => (
            <li key={r.id} className="flex gap-2.5 text-sm">
              {r.toEmployee.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.toEmployee.photoUrl}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-full border border-gray-200 object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-500">
                  {r.toEmployee.fullName.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900">{r.toEmployee.fullName}</p>
                <p className="truncate text-brand-700 dark:text-brand-300">&laquo;{r.title}&raquo;</p>
                {r.message && <p className="mt-0.5 text-gray-500">&ldquo;{r.message}&rdquo;</p>}
                <p className="mt-0.5 text-xs text-gray-500">
                  {dict.from} {r.fromEmployee.fullName} · {formatDateLong(r.createdAt, locale, true)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {isOpen && (
        <GiveRecognitionModal
          dict={dict}
          onClose={() => setIsOpen(false)}
          onCreated={() => {
            setIsOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
