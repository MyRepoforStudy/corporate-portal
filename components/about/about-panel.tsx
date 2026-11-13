"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { AboutChapterView, AboutSectionView } from "@/lib/about";
import { RichText } from "@/components/about/rich-text";

type Status = "loading" | "ready" | "error";

/**
 * The "О нас" tab: chapters of the Welcome Book as filter pills, their sections as
 * accordions. The texts come from /api/about in the language of the current cookie
 * (so `locale` is a dependency: after a language switch they are fetched again).
 */
export function AboutPanel({
  locale,
  dict,
  tabBar,
}: {
  locale: Locale;
  dict: Dictionary["home"]["about"];
  /** "Новости | О нас" - shown in the header row, like on the news tab. */
  tabBar: ReactNode;
}) {
  const [status, setStatus] = useState<Status>("loading");
  const [chapters, setChapters] = useState<AboutChapterView[]>([]);
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetch("/api/about")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: { chapters: AboutChapterView[] }) => {
        if (cancelled) return;
        setChapters(data.chapters);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [locale, attempt]);

  function toggle(key: string) {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }

  // The chosen chapter can vanish after a reload (hidden or deleted in the admin).
  const selected = chapters.find((chapter) => chapter.id === chapterId) ?? null;
  const visible = selected ? [selected] : chapters;

  function renderSection(section: AboutSectionView) {
    const isOpen = openKeys.has(section.key);
    return (
      <div key={section.key} className="rounded-lg border border-gray-200 bg-white">
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => toggle(section.key)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span className="text-sm font-medium text-gray-900">{section.title}</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-gray-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
        <div className="collapsible" data-open={isOpen}>
          <div>
            <div className="border-t border-gray-100 px-4 py-4">
              {section.body.trim() ? <RichText text={section.body} /> : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        {tabBar}
        {status === "ready" && chapters.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {[{ id: null, title: dict.all }, ...chapters].map((chapter) => {
              const active = (chapter.id ?? null) === (selected?.id ?? null);
              return (
                <button
                  key={chapter.id ?? "all"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setChapterId(chapter.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    active ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {chapter.title}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {status === "loading" && (
        <div className="space-y-2" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer h-12 rounded-lg border border-gray-200 bg-gray-100" />
          ))}
        </div>
      )}

      {status === "error" && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
          <p>{dict.loadFailed}</p>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="mt-2 font-medium text-brand-700 hover:underline dark:text-brand-300"
          >
            {dict.retry}
          </button>
        </div>
      )}

      {status === "ready" && chapters.length === 0 && <p className="text-sm text-gray-500">{dict.empty}</p>}

      {status === "ready" && (
        <div className="space-y-6">
          {visible.map((chapter) => (
            <section key={chapter.key}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{chapter.title}</h3>
              {chapter.body.trim() && (
                <div className="mb-3 rounded-lg border border-gray-200 bg-white p-4">
                  <RichText text={chapter.body} />
                </div>
              )}
              <div className="space-y-2">{chapter.sections.map(renderSection)}</div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
