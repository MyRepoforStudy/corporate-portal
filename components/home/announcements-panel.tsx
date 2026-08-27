import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { News } from "@prisma/client";
import type { Locale } from "@/lib/i18n";
import { formatDateLong } from "@/lib/i18n/format";

export function AnnouncementsPanel({
  announcements,
  locale,
  title,
  emptyText,
  allLabel,
}: {
  announcements: Pick<News, "id" | "title" | "createdAt">[];
  locale: Locale;
  title: string;
  emptyText: string;
  allLabel: string;
}) {
  return (
    <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-900 dark:bg-brand-950/40">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
          <h3 className="font-medium text-brand-800 dark:text-brand-200">{title}</h3>
        </div>
        {announcements.length > 0 && (
          <Link href="#news" className="shrink-0 text-xs text-brand-700 hover:underline dark:text-brand-300">
            {allLabel}
          </Link>
        )}
      </div>
      {announcements.length === 0 ? (
        <p className="text-sm text-brand-700/70 dark:text-brand-300/70">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {announcements.map((item) => (
            <li key={item.id}>
              <Link
                href="#news"
                className="flex items-start justify-between gap-3 text-sm text-brand-900 hover:underline dark:text-brand-100"
              >
                <span className="min-w-0 truncate">{item.title}</span>
                <span className="shrink-0 text-xs text-brand-600/80 dark:text-brand-400/80">
                  {formatDateLong(item.createdAt, locale, true)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
