"use client";

import { useState } from "react";
import { Paperclip, X } from "lucide-react";
import type { News } from "@prisma/client";
import type { Locale } from "@/lib/i18n";
import { formatDateLong } from "@/lib/i18n/format";

const RECENT_THRESHOLD_MS = 48 * 60 * 60 * 1000;

function isRecent(date: Date | string) {
  return Date.now() - new Date(date).getTime() < RECENT_THRESHOLD_MS;
}

function NewBadge({ label }: { label: string }) {
  return (
    <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-medium text-white shadow-sm">
      {label}
    </span>
  );
}

function DocumentLink({ item }: { item: News }) {
  if (!item.documentUrl) return null;
  return (
    <a
      href={item.documentUrl}
      download={item.documentName ?? undefined}
      onClick={(e) => e.stopPropagation()}
      className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:border-brand-300 hover:text-brand-700 dark:hover:text-brand-300"
    >
      <Paperclip className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="max-w-[240px] truncate">{item.documentName ?? "Документ"}</span>
    </a>
  );
}

function FeaturedCard({
  item,
  locale,
  newBadge,
  onOpen,
}: {
  item: News;
  locale: Locale;
  newBadge: string;
  onOpen: () => void;
}) {
  return (
    <article
      onClick={onOpen}
      className="group relative cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-sm"
    >
      {isRecent(item.createdAt) && <NewBadge label={newBadge} />}
      {item.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt="" className="h-64 w-full bg-gray-50 object-contain sm:h-72" />
      )}
      <div className="p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h3 className="font-medium text-gray-900 transition group-hover:text-brand-700 dark:group-hover:text-brand-300">{item.title}</h3>
          <span className="shrink-0 text-xs text-gray-500">{formatDateLong(item.createdAt, locale, true)}</span>
        </div>
        <p className="line-clamp-4 max-w-prose whitespace-pre-line text-sm text-gray-600">{item.content}</p>
        <DocumentLink item={item} />
      </div>
    </article>
  );
}

function CompactCard({
  item,
  locale,
  newBadge,
  onOpen,
}: {
  item: News;
  locale: Locale;
  newBadge: string;
  onOpen: () => void;
}) {
  return (
    <article
      onClick={onOpen}
      className="group relative cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-sm"
    >
      {isRecent(item.createdAt) && <NewBadge label={newBadge} />}
      {item.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt="" className="h-24 w-full object-cover" />
      )}
      <div className="p-3">
        <h4 className="truncate text-sm font-medium text-gray-900 transition group-hover:text-brand-700 dark:group-hover:text-brand-300">
          {item.title}
        </h4>
        <p className="mt-0.5 text-xs text-gray-500">{formatDateLong(item.createdAt, locale, true)}</p>
        <p className="mt-1 line-clamp-2 text-xs text-gray-600">{item.content}</p>
      </div>
    </article>
  );
}

function NewsModal({ item, locale, onClose }: { item: News; locale: Locale; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" className="max-h-[50vh] w-full bg-gray-50 object-contain" />
        )}
        <div className="p-6">
          <div className="mb-2 flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">{item.title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <p className="mb-4 text-xs text-gray-500">{formatDateLong(item.createdAt, locale, true)}</p>
          <p className="whitespace-pre-line text-sm text-gray-700">{item.content}</p>
          <DocumentLink item={item} />
        </div>
      </div>
    </div>
  );
}

export function NewsList({
  news,
  locale,
  emptyText,
  newBadge,
}: {
  news: News[];
  locale: Locale;
  emptyText: string;
  newBadge: string;
}) {
  const [openItem, setOpenItem] = useState<News | null>(null);

  if (news.length === 0) {
    return <p className="text-sm text-gray-500">{emptyText}</p>;
  }

  const [featured, ...rest] = news;

  return (
    <>
      <div className={`grid grid-cols-1 gap-4 ${rest.length > 0 ? "lg:grid-cols-[1.6fr_1fr]" : ""}`}>
        <FeaturedCard item={featured} locale={locale} newBadge={newBadge} onOpen={() => setOpenItem(featured)} />
        {rest.length > 0 && (
          <div className="space-y-4">
            {rest.map((item) => (
              <CompactCard
                key={item.id}
                item={item}
                locale={locale}
                newBadge={newBadge}
                onOpen={() => setOpenItem(item)}
              />
            ))}
          </div>
        )}
      </div>
      {openItem && <NewsModal item={openItem} locale={locale} onClose={() => setOpenItem(null)} />}
    </>
  );
}
