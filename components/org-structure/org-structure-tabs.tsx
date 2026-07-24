"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface OrgStructureTab {
  href: string;
  label: string;
}

export function OrgStructureTabs({ tabs }: { tabs: OrgStructureTab[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-gray-200">
      {tabs.map((tab) => {
        const isActive =
          tab.href === "/org-structure" ? pathname === tab.href : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
              isActive
                ? "border-brand-600 text-brand-700 dark:border-brand-400 dark:text-brand-300"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
