"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * State of a carousel that moves on by itself every `intervalMs`. Shared by the
 * birthdays and new-hires slides on the home page.
 */
export function useCarousel(length: number, intervalMs = 6000) {
  const [index, setIndex] = useState(0);
  // The list can shrink while the page stays open (an entry expires after an
  // automatic refresh), so never index past its end.
  const active = index < length ? index : 0;

  useEffect(() => {
    if (length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % length), intervalMs);
    return () => clearInterval(timer);
  }, [length, intervalMs]);

  return {
    active,
    select: setIndex,
    next: () => setIndex((i) => (i + 1) % length),
    prev: () => setIndex((i) => (i - 1 + length) % length),
  };
}

/** Arrows with one dot per slide. Renders an empty span for a single slide so the
 * element next to it (the footer's action button) stays at the right edge. */
export function CarouselPager({
  count,
  active,
  onSelect,
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
  dotLabel,
}: {
  count: number;
  active: number;
  onSelect: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  prevLabel: string;
  nextLabel: string;
  /** Accessible name of the dot for slide `index`. */
  dotLabel: (index: number) => string;
}) {
  if (count <= 1) return <span />;

  const arrowClass =
    "flex h-6 w-6 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800";

  return (
    <div className="flex items-center gap-0.5">
      <button type="button" onClick={onPrev} aria-label={prevLabel} className={arrowClass}>
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>
      <div className="flex items-center">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            aria-label={dotLabel(i)}
            aria-current={i === active ? "true" : undefined}
            // 16px hit area around a 6px dot
            className="group flex h-4 w-4 items-center justify-center"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i === active ? "bg-brand-600" : "bg-gray-300 group-hover:bg-gray-400"
              }`}
            />
          </button>
        ))}
      </div>
      <button type="button" onClick={onNext} aria-label={nextLabel} className={arrowClass}>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
