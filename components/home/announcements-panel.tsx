"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, X } from "lucide-react";
import type { Announcement } from "@prisma/client";
import type { Locale } from "@/lib/i18n";
import { formatDateLong } from "@/lib/i18n/format";
import { useModalClose } from "@/lib/hooks/use-modal-close";

const COLLAPSED_COUNT = 3;

type AnnouncementItem = Pick<Announcement, "id" | "title" | "createdAt">;

export function AnnouncementsPanel({
  announcements,
  locale,
  title,
  emptyText,
  showMoreLabel,
  showLessLabel,
  closeLabel,
}: {
  announcements: AnnouncementItem[];
  locale: Locale;
  title: string;
  emptyText: string;
  showMoreLabel: string;
  showLessLabel: string;
  closeLabel: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [openItem, setOpenItem] = useState<AnnouncementItem | null>(null);

  const head = announcements.slice(0, COLLAPSED_COUNT);
  const tail = announcements.slice(COLLAPSED_COUNT);
  const hasMore = tail.length > 0;

  function renderItem(item: AnnouncementItem) {
    return (
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
    );
  }

  return (
    <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 dark:border-brand-900 dark:bg-brand-950/40">
      <div className="mb-2 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
        <h3 className="font-medium text-brand-800 dark:text-brand-200">{title}</h3>
      </div>
      {announcements.length === 0 ? (
        <p className="text-sm text-brand-700/70 dark:text-brand-300/70">{emptyText}</p>
      ) : (
        <>
          <ul className="space-y-2">{head.map(renderItem)}</ul>
          {hasMore && (
            <>
              {/* The rest of the list slides open/closed (the padding lives inside the clipped box) */}
              <div className="collapsible" data-open={isExpanded}>
                <div>
                  <ul className="space-y-2 pt-2">{tail.map(renderItem)}</ul>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded((v) => !v)}
                aria-expanded={isExpanded}
                className="mt-2 flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline dark:text-brand-300"
              >
                {isExpanded ? showLessLabel : showMoreLabel}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
            </>
          )}
        </>
      )}

      {openItem && (
        <AnnouncementModal
          item={openItem}
          locale={locale}
          closeLabel={closeLabel}
          onClose={() => setOpenItem(null)}
        />
      )}
    </div>
  );
}

function AnnouncementModal({
  item,
  locale,
  closeLabel,
  onClose,
}: {
  item: AnnouncementItem;
  locale: Locale;
  closeLabel: string;
  onClose: () => void;
}) {
  const { closing, close } = useModalClose(onClose);

  return (
    <div
      className={`modal-overlay fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4 ${closing ? "is-closing" : ""}`}
      onClick={close}
    >
      <div
        className="modal-panel w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
            <span className="text-xs text-gray-500">{formatDateLong(item.createdAt, locale, true)}</span>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label={closeLabel}
            className="shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <p className="whitespace-pre-line text-sm text-gray-900">{item.title}</p>
      </div>
    </div>
  );
}
