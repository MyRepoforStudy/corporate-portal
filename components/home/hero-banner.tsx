import Link from "next/link";
import { CalendarClock, Compass, Search } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatWelcome } from "@/lib/i18n/format";
import { BrandPattern } from "@/components/ui/brand-pattern";

export function HeroBanner({
  displayName,
  locale,
  dict,
}: {
  displayName: string;
  locale: Locale;
  dict: Dictionary["home"];
}) {
  const actions = [
    { href: "/bookings", label: dict.quickActions.bookRoom, icon: CalendarClock },
    { href: "/org-structure", label: dict.quickActions.findEmployee, icon: Search },
    { href: "/compass", label: dict.quickActions.compass, icon: Compass },
  ];

  return (
    <div className="relative flex h-full flex-col justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-7 sm:px-10 sm:py-8">
      <BrandPattern variant="hero" />
      <div className="relative">
        <p className="text-xl font-semibold text-white sm:text-2xl">{formatWelcome(displayName, locale)}</p>
        <p className="mt-2 max-w-lg text-sm text-brand-50">{dict.tagline}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/15 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-white/25 active:scale-[0.97]"
            >
              <action.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
