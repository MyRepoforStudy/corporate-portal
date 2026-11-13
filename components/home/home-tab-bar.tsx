"use client";

import type { KeyboardEvent } from "react";
import { useHomeTab, type HomeTab } from "@/lib/hooks/use-home-tab";

const TABS: HomeTab[] = ["news", "about"];

/**
 * "Новости | О нас" - the headings of the left column, doubling as tabs. Each panel
 * shows its own copy of the bar in its header row, so `panel` (the panel the copy
 * sits in) keeps the element ids unique.
 */
export function HomeTabBar({ labels, panel }: { labels: Record<HomeTab, string>; panel: HomeTab }) {
  const [tab, setTab] = useHomeTab();

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const next = TABS[(TABS.indexOf(tab) + (event.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
    setTab(next);
    event.currentTarget.querySelector<HTMLElement>(`[data-tab="${next}"]`)?.focus();
  }

  return (
    <div role="tablist" onKeyDown={handleKeyDown} className="flex items-end gap-5">
      {TABS.map((id) => {
        const selected = tab === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            id={`home-tab-${id}-in-${panel}`}
            data-tab={id}
            aria-selected={selected}
            aria-controls={`home-panel-${id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => setTab(id)}
            className={`relative pb-1 text-lg font-semibold transition-colors ${
              selected ? "text-gray-900" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {labels[id]}
            <span
              aria-hidden="true"
              className={`absolute inset-x-0 -bottom-px h-0.5 origin-left rounded-full bg-brand-600 transition-transform duration-200 ${
                selected ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
