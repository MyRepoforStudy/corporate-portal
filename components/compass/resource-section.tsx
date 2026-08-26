import { ExternalLink } from "lucide-react";
import type { ResourceLink } from "@prisma/client";

export function ResourceSection({
  resources,
  title,
  emptyText,
  openLabel,
}: {
  resources: ResourceLink[];
  title: string;
  emptyText: string;
  openLabel: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="mb-3 font-medium text-gray-900">{title}</h2>
      {resources.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyText}</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <a
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-700 transition hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/30"
            >
              <span className="min-w-0 truncate">{resource.title}</span>
              <span className="flex shrink-0 items-center gap-1 text-xs text-brand-700 dark:text-brand-300">
                {openLabel}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
