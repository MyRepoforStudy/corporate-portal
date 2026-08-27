import type { Dictionary, Locale } from "@/lib/i18n";
import { formatWelcome } from "@/lib/i18n/format";

/** Abstract geometric pattern in the brand red family - deliberately not a
 * stock "our building" photo, since this is a real bank's internal portal
 * and a generic stock photo presented as "our HQ" would be misleading.
 * Same rotated-square motif as SideDecoration (components/layout/side-decoration.tsx). */
function HeroPattern() {
  const squares = [
    { size: 160, top: "-20%", right: "4%", rotate: 18, opacity: 0.16 },
    { size: 100, top: "40%", right: "18%", rotate: -12, opacity: 0.14 },
    { size: 70, top: "68%", right: "2%", rotate: 24, opacity: 0.18 },
  ];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {squares.map((sq, i) => (
        <div
          key={i}
          className="absolute rounded-2xl bg-white"
          style={{
            width: sq.size,
            height: sq.size,
            top: sq.top,
            right: sq.right,
            opacity: sq.opacity,
            transform: `rotate(${sq.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export function HeroBanner({
  displayName,
  locale,
  dict,
}: {
  displayName: string;
  locale: Locale;
  dict: Dictionary["home"];
}) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-8 sm:px-10 sm:py-10">
      <HeroPattern />
      <div className="relative">
        <p className="text-xl font-semibold text-white sm:text-2xl">{formatWelcome(displayName, locale)}</p>
        <p className="mt-2 max-w-lg text-sm text-brand-100">{dict.tagline}</p>
      </div>
    </div>
  );
}
