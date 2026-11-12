"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  User,
  Building2,
  CalendarClock,
  Compass,
  ShieldCheck,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import type { ResourceLink } from "@prisma/client";
import type { Dictionary } from "@/lib/i18n";
import { RESOURCE_LINK_ICONS } from "@/lib/resource-link-icons";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavRow({
  href,
  label,
  icon: Icon,
  active,
  external,
  slider,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  external?: boolean;
  /** The sliding highlight (see IconSidebar) paints the active background; otherwise the row does it itself. */
  slider?: boolean;
}) {
  // Every row sits above the sliding highlight (relative z-10) so its text stays readable while it passes by.
  const className = `relative z-10 flex items-center gap-3 rounded-none px-3 py-2.5 text-sm transition-colors duration-200 ${
    active
      ? `font-medium text-white ${slider ? "" : "bg-brand-600"}`
      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
    <Link
      href={href}
      className={className}
      data-nav-active={active ? "true" : undefined}
      aria-current={active ? "page" : undefined}
    >
      {content}
    </Link>
  );
}

interface Highlight {
  top: number;
  height: number;
  /** false while the active page is not in this list (the admin link has its own block below). */
  visible: boolean;
  /** Slide to the new row; false for the first placement and for resizes. */
  animate: boolean;
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
  const listRef = useRef<HTMLDivElement>(null);
  const placedOnce = useRef(false);
  const [highlight, setHighlight] = useState<Highlight | null>(null);

  const links = [
    { href: "/", label: dict.nav.home, icon: Home },
    { href: "/compass", label: dict.nav.compass, icon: Compass },
    { href: "/org-structure", label: dict.nav.orgStructure, icon: Building2 },
    { href: "/bookings", label: dict.nav.bookings, icon: CalendarClock },
    { href: "/profile", label: dict.nav.profile, icon: User },
  ];

  // Measure the active row and put the highlight on it. Until the first
  // measurement (server render, hydration) the active row paints its own
  // background, so there is no flash.
  const place = useCallback((animate: boolean) => {
    const row = listRef.current?.querySelector<HTMLElement>('[data-nav-active="true"]');
    if (!row || row.offsetHeight === 0) {
      // Not in this list (e.g. the admin page), or the sidebar is hidden (small screens).
      setHighlight((prev) => (prev ? { ...prev, visible: false, animate } : prev));
      return;
    }
    setHighlight({ top: row.offsetTop, height: row.offsetHeight, visible: true, animate });
  }, []);

  // The page changed: slide to the new row (the very first placement has nothing to slide from).
  useLayoutEffect(() => {
    place(placedOnce.current);
    placedOnce.current = true;
  }, [pathname, place]);

  // The sidebar is display:none below the sm breakpoint: re-measure, without sliding,
  // when it appears or changes size. Created once: an observer's first callback would
  // otherwise arrive mid-slide and cancel the transition.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const observer = new ResizeObserver(() => place(false));
    observer.observe(list);
    return () => observer.disconnect();
  }, [place]);

  const slider = !!highlight?.visible;

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-gray-200 bg-white py-4 sm:flex">
      <div ref={listRef} className="relative flex flex-1 flex-col gap-1 overflow-y-auto px-3">
        {highlight && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 right-3 top-0 bg-brand-600"
            style={{
              height: highlight.height,
              transform: `translateY(${highlight.top}px)`,
              opacity: highlight.visible ? 1 : 0,
              transition: highlight.animate
                ? "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease"
                : "none",
            }}
          />
        )}

        {links.map((link) => (
          <NavRow key={link.href} {...link} active={isActive(pathname, link.href)} slider={slider} />
        ))}

        {resourceLinks.length > 0 && (
          <>
            <div className="px-3 pb-1 pt-4 text-xs font-medium uppercase tracking-wide text-gray-500">
              {dict.nav.resourceLinks}
            </div>
            {resourceLinks.map((link) => (
              <NavRow
                key={link.id}
                href={link.url}
                label={link.title}
                icon={RESOURCE_LINK_ICONS[link.icon] ?? ExternalLink}
                active={false}
                external
              />
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
