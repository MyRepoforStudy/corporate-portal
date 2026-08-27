"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { News, NewsCategory } from "@prisma/client";
import type { Dictionary } from "@/lib/i18n";

export type FeaturedNewsItem = Pick<News, "id" | "title" | "imageUrl" | "createdAt"> & {
  category: NewsCategory | null;
};

/** Replaces the old manually-uploaded "Команда в деле" photo banner - same
 * visual slot, but sourced from real news (pinned/recent posts that have an
 * image) instead of a separate admin-managed gallery, so there's nothing new
 * to keep filled in. Clicking a slide jumps to the news grid below (#news),
 * same pattern as AnnouncementsPanel's "Все новости" link. */
export function FeaturedNewsCarousel({
  items,
  dict,
}: {
  items: FeaturedNewsItem[];
  dict: Dictionary["home"]["featuredNews"];
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) return null;

  const current = items[index];

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200">
      <div className="relative h-[260px] bg-black sm:h-[340px]">
        <a href="#news" className="absolute inset-0 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.imageUrl ?? ""} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
            {current.category && (
              <span className="mb-1.5 inline-block rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-medium text-white">
                {current.category.name}
              </span>
            )}
            <h3 className="max-w-2xl text-base font-medium text-white sm:text-lg">{current.title}</h3>
          </div>
        </a>

        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
              aria-label={dict.prev}
              className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % items.length)}
              aria-label={dict.next}
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`${dict.slide} ${i + 1}`}
                  className={`h-1.5 w-1.5 rounded-full transition ${i === index ? "bg-brand-500" : "bg-white/40"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
