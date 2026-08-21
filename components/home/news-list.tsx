"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Newspaper, Paperclip, Pin, X } from "lucide-react";
import type { News } from "@prisma/client";
import type { Locale } from "@/lib/i18n";
import { formatDateLong } from "@/lib/i18n/format";

const RECENT_THRESHOLD_MS = 48 * 60 * 60 * 1000;
const LIST_COUNT = 4;

function isRecent(date: Date | string) {
  return Date.now() - new Date(date).getTime() < RECENT_THRESHOLD_MS;
}

function PinBadge({ className }: { className?: string }) {
  return (
    <span
      className={`flex shrink-0 items-center gap-1 rounded-full bg-brand-700 px-2 py-0.5 text-[10px] font-medium text-white shadow-sm ${className ?? ""}`}
    >
      <Pin className="h-2.5 w-2.5" aria-hidden="true" />
      Закреплено
    </span>
  );
}

function NewBadge({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={`rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-medium text-white shadow-sm ${className ?? ""}`}
    >
      {label}
    </span>
  );
}

function DocumentLink({ item, dark }: { item: News; dark?: boolean }) {
  if (!item.documentUrl) return null;
  return (
    <a
      href={item.documentUrl}
      download={item.documentName ?? undefined}
      onClick={(e) => e.stopPropagation()}
      className={`mt-2 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs ${
        dark
          ? "border-white/30 text-white/90 hover:border-white/60 hover:text-white"
          : "border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-700 dark:hover:text-brand-300"
      }`}
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
  const showBadge = isRecent(item.createdAt);

  if (!item.imageUrl) {
    return (
      <article
        onClick={onOpen}
        className={`group flex min-h-[280px] cursor-pointer flex-col overflow-hidden rounded-lg border p-4 transition hover:shadow-sm ${
          item.isPinned
            ? "border-brand-200 bg-brand-50/50 hover:border-brand-300"
            : "border-gray-200 bg-white hover:border-brand-300"
        }`}
      >
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {item.isPinned && <PinBadge />}
            {showBadge && <NewBadge label={newBadge} />}
            <h3 className="truncate text-lg font-semibold text-gray-900 transition group-hover:text-brand-700 dark:group-hover:text-brand-300">
              {item.title}
            </h3>
          </div>
          <span className="shrink-0 text-xs text-gray-500">{formatDateLong(item.createdAt, locale, true)}</span>
        </div>
        <p className="line-clamp-6 max-w-prose whitespace-pre-line text-sm text-gray-600">{item.content}</p>
        <DocumentLink item={item} />
      </article>
    );
  }

  return (
    <article
      onClick={onOpen}
      className="group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:border-brand-300 hover:shadow-sm"
    >
      <div className="relative h-64 w-full sm:h-80">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {item.isPinned && <PinBadge />}
          {showBadge && <NewBadge label={newBadge} />}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <h3 className="text-lg font-semibold text-white transition group-hover:text-brand-200 sm:text-xl">
            {item.title}
          </h3>
          <span className="mt-1 block text-xs text-white/80">{formatDateLong(item.createdAt, locale, true)}</span>
        </div>
      </div>
      <div className="p-4">
        <p className="line-clamp-2 max-w-prose whitespace-pre-line text-sm text-gray-600">{item.content}</p>
        <DocumentLink item={item} />
      </div>
    </article>
  );
}

function ListRow({
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
  const showBadge = isRecent(item.createdAt);

  return (
    <article
      onClick={onOpen}
      className="group flex cursor-pointer items-center gap-3 rounded-md px-1 py-2 transition hover:bg-gray-50"
    >
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-md object-cover" />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-gray-100">
          <Newspaper className="h-5 w-5 text-gray-300" aria-hidden="true" />
        </div>
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          {item.isPinned && <Pin className="h-3 w-3 shrink-0 text-brand-600" aria-hidden="true" />}
          {showBadge && (
            <span className="shrink-0 rounded-full bg-brand-600 px-1.5 py-0.5 text-[9px] font-medium text-white">
              {newBadge}
            </span>
          )}
          <h4 className="line-clamp-2 text-sm font-medium text-gray-900 transition group-hover:text-brand-700 dark:group-hover:text-brand-300">
            {item.title}
          </h4>
        </div>
        <p className="mt-1 text-xs text-gray-500">{formatDateLong(item.createdAt, locale, true)}</p>
      </div>
    </article>
  );
}

function SecondaryCard({
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
  const showBadge = isRecent(item.createdAt);

  return (
    <article
      onClick={onOpen}
      className="group w-64 shrink-0 cursor-pointer snap-start overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:border-brand-300 hover:shadow-sm"
    >
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt="" className="h-32 w-full object-cover" />
      ) : (
        <div className="flex h-32 w-full items-center justify-center bg-gray-100">
          <Newspaper className="h-8 w-8 text-gray-300" aria-hidden="true" />
        </div>
      )}
      <div className="p-3">
        <div className="mb-1.5 flex items-center gap-1.5">
          {item.isPinned && <PinBadge />}
          {showBadge && <NewBadge label={newBadge} />}
        </div>
        <h4 className="line-clamp-2 text-sm font-medium text-gray-900 transition group-hover:text-brand-700 dark:group-hover:text-brand-300">
          {item.title}
        </h4>
        <p className="mt-1 line-clamp-2 text-xs text-gray-600">{item.content}</p>
        <p className="mt-1.5 text-xs text-gray-500">{formatDateLong(item.createdAt, locale, true)}</p>
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
  moreNewsLabel,
}: {
  news: News[];
  locale: Locale;
  emptyText: string;
  newBadge: string;
  moreNewsLabel?: string;
}) {
  const [openItem, setOpenItem] = useState<News | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (news.length === 0) {
    return <p className="text-sm text-gray-500">{emptyText}</p>;
  }

  const [featured, ...rest] = news;
  const list = rest.slice(0, LIST_COUNT);
  const carousel = rest.slice(LIST_COUNT);

  const scrollBy = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <>
      <div className={`grid grid-cols-1 items-start gap-6 ${list.length > 0 ? "lg:grid-cols-[1.8fr_1fr]" : ""}`}>
        <FeaturedCard item={featured} locale={locale} newBadge={newBadge} onOpen={() => setOpenItem(featured)} />
        {list.length > 0 && (
          <div className="divide-y divide-gray-100">
            {list.map((item) => (
              <ListRow key={item.id} item={item} locale={locale} newBadge={newBadge} onOpen={() => setOpenItem(item)} />
            ))}
          </div>
        )}
      </div>

      {carousel.length > 0 && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">{moreNewsLabel}</h3>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => scrollBy(-1)}
                aria-label="Назад"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-700"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => scrollBy(1)}
                aria-label="Вперёд"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-700"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div ref={scrollRef} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {carousel.map((item) => (
              <SecondaryCard
                key={item.id}
                item={item}
                locale={locale}
                newBadge={newBadge}
                onOpen={() => setOpenItem(item)}
              />
            ))}
          </div>
        </div>
      )}

      {openItem && <NewsModal item={openItem} locale={locale} onClose={() => setOpenItem(null)} />}
    </>
  );
}
