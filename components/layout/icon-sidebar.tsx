"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, Building2, CalendarClock, ShieldCheck, ExternalLink, type LucideIcon } from "lucide-react";
import type { ResourceLink } from "@prisma/client";
import type { Dictionary } from "@/lib/i18n";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function RailLink({
  href,
  label,
  icon: Icon,
  active,
  external,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  external?: boolean;
}) {
  const content = (
    <>
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
          active
            ? "bg-brand-600 text-white"
            : "bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-300 dark:hover:bg-brand-900/50"
        }`}
      >
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <span className={`line-clamp-2 text-[10px] leading-tight ${active ? "text-gray-900" : "text-gray-500"}`}>
        {label}
      </span>
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={label}
        className="flex shrink-0 flex-col items-center gap-1 px-1 py-1 text-center"
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} title={label} className="flex shrink-0 flex-col items-center gap-1 px-1 py-1 text-center">
      {content}
    </Link>
  );
}

export function IconSidebar({
  dict,
  isAdmin,
  resourceLinks,
}: {
  dict: Dictionary;
  isAdmin: boolean;
  resourceLinks: ResourceLink[];
}) {
  const pathname = usePathname();

  const links = [
    { href: "/profile", label: dict.nav.profile, icon: User },
    { href: "/", label: dict.nav.home, icon: Home },
    { href: "/org-structure", label: dict.nav.orgStructure, icon: Building2 },
    { href: "/bookings", label: dict.nav.bookings, icon: CalendarClock },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-20 shrink-0 flex-col border-r border-gray-200 bg-white py-5 sm:flex">
      <div className="flex flex-1 flex-col items-center gap-5 overflow-y-auto">
        {links.map((link) => (
          <RailLink key={link.href} {...link} active={isActive(pathname, link.href)} />
        ))}
        {resourceLinks.length > 0 && <div className="h-px w-8 shrink-0 bg-gray-200" />}
        {resourceLinks.map((link) => (
          <RailLink key={link.id} href={link.url} label={link.title} icon={ExternalLink} active={false} external />
        ))}
      </div>
      {isAdmin && (
        <div className="flex shrink-0 flex-col items-center pt-3">
          <RailLink href="/admin" label={dict.nav.admin} icon={ShieldCheck} active={isActive(pathname, "/admin")} />
        </div>
      )}
    </aside>
  );
}
