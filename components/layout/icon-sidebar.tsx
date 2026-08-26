"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, Building2, CalendarClock, Compass, ShieldCheck, ExternalLink, type LucideIcon } from "lucide-react";
import type { ResourceLink } from "@prisma/client";
import type { Dictionary } from "@/lib/i18n";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavRow({
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
  const className = `flex items-center gap-3 rounded-none px-3 py-2.5 text-sm transition ${
    active ? "bg-brand-600 font-medium text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
  }`;
  const content = (
    <>
      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {external && <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden="true" />}
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

export function IconSidebar({
  dict,
  canAccessAdmin,
  resourceLinks,
}: {
  dict: Dictionary;
  canAccessAdmin: boolean;
  resourceLinks: ResourceLink[];
}) {
  const pathname = usePathname();

  const links = [
    { href: "/", label: dict.nav.home, icon: Home },
    { href: "/compass", label: dict.nav.compass, icon: Compass },
    { href: "/org-structure", label: dict.nav.orgStructure, icon: Building2 },
    { href: "/bookings", label: dict.nav.bookings, icon: CalendarClock },
    { href: "/profile", label: dict.nav.profile, icon: User },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-gray-200 bg-white py-4 sm:flex">
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
        {links.map((link) => (
          <NavRow key={link.href} {...link} active={isActive(pathname, link.href)} />
        ))}

        {resourceLinks.length > 0 && (
          <>
            <div className="px-3 pb-1 pt-4 text-xs font-medium uppercase tracking-wide text-gray-400">
              {dict.nav.resourceLinks}
            </div>
            {resourceLinks.map((link) => (
              <NavRow key={link.id} href={link.url} label={link.title} icon={ExternalLink} active={false} external />
            ))}
          </>
        )}
      </div>

      {canAccessAdmin && (
        <div className="shrink-0 border-t border-gray-200 px-3 pt-3">
          <NavRow href="/admin" label={dict.nav.admin} icon={ShieldCheck} active={isActive(pathname, "/admin")} />
        </div>
      )}
    </aside>
  );
}
