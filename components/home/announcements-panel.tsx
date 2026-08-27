"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, X } from "lucide-react";
import type { Announcement } from "@prisma/client";
import type { Locale } from "@/lib/i18n";
import { formatDateLong } from "@/lib/i18n/format";

const COLLAPSED_COUNT = 3;

export function AnnouncementsPanel({
  announcements,
  locale,
  title,
  emptyText,
  allLabel,
  showMoreLabel,
  showLessLabel,
  closeLabel,
}: {
  announcements: Pick<Announcement, "id" | "title" | "createdAt">[];
  locale: Locale;
  title: string;
  emptyText: string;
  allLabel: string;
  showMoreLabel: string;
  showLessLabel: string;
  closeLabel: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [openItem, setOpenItem] = useState<Pick<Announcement, "id" | "title" | "createdAt"> | null>(null);

  const visible = isExpanded ? announcements : announcements.slice(0, COLLAPSED_COUNT);
  const hasMore = announcements.length > COLLAPSED_COUNT;

  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-900 dark:bg-brand-950/40">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
          <h3 className="font-medium text-brand-800 dark:text-brand-200">{title}</h3>
        </div>
        {announcements.length > 0 && (
          <a href="#news" className="shrink-0 text-xs text-brand-700 hover:underline dark:text-brand-300">
            {allLabel}
          </a>
        )}
      </div>
      {announcements.length === 0 ? (
        <p className="text-sm text-brand-700/70 dark:text-brand-300/70">{emptyText}</p>
      ) : (
        <>
          <ul className="space-y-2">
            {visible.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setOpenItem(item)}
                  className="block w-full text-left text-sm text-brand-900 hover:underline dark:text-brand-100"
                >
                  <span className="line-clamp-2">{item.title}</span>
                  <span className="mt-0.5 block text-xs text-brand-600/80 dark:text-brand-400/80">
                    {formatDateLong(item.createdAt, locale, true)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {hasMore && (
            <button
              type="button"
              onClick={() => setIsExpanded((v) => !v)}
              className="mt-2 flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline dark:text-brand-300"
            >
              {isExpanded ? (
                <>
                  {showLessLabel}
                  <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                </>
              ) : (
                <>
                  {showMoreLabel}
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                </>
              )}
            </button>
          )}
        </>
      )}

      {openItem && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4" onClick={() => setOpenItem(null)}>
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                <span className="text-xs text-gray-500">{formatDateLong(openItem.createdAt, locale, true)}</span>
              </div>
              <button
                type="button"
                onClick={() => setOpenItem(null)}
                aria-label={closeLabel}
                className="shrink-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <p className="whitespace-pre-line text-sm text-gray-900">{openItem.title}</p>
          </div>
        </div>
      )}
    </div>
  );
}
