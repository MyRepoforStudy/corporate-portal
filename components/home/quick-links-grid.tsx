import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export interface QuickLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function QuickLinksGrid({ title, links }: { title: string; links: QuickLink[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 font-medium text-gray-900">{title}</h3>
      <div className="grid grid-cols-3 gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex flex-col items-center gap-1.5 rounded-lg p-2 text-center transition hover:bg-gray-50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/40">
              <link.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-xs text-gray-600">{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
