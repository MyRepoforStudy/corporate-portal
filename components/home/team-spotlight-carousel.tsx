"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { TeamSpotlight } from "@prisma/client";
import type { Dictionary } from "@/lib/i18n";

export function TeamSpotlightCarousel({
  spotlights,
  dict,
}: {
  spotlights: TeamSpotlight[];
  dict: Dictionary["home"]["teamSpotlight"];
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (spotlights.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % spotlights.length), 6000);
    return () => clearInterval(timer);
  }, [spotlights.length]);

  if (spotlights.length === 0) return null;

  const current = spotlights[index];

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200">
      <div className="relative h-[260px] bg-black sm:h-[340px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.imageUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-2xl"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.imageUrl} alt="" className="absolute inset-0 h-full w-full object-contain" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
          <h3 className="max-w-2xl text-base font-medium text-white sm:text-lg">{current.caption}</h3>
        </div>

        {spotlights.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + spotlights.length) % spotlights.length)}
              aria-label={dict.prev}
              className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % spotlights.length)}
              aria-label={dict.next}
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {spotlights.map((_, i) => (
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
