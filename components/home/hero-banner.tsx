import type { Dictionary, Locale } from "@/lib/i18n";
import { formatWelcome } from "@/lib/i18n/format";

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
    <div className="rounded-xl border border-gray-200 border-l-4 border-l-brand-600 bg-white px-6 py-6 sm:px-10">
      <p className="text-lg font-semibold text-gray-900 sm:text-xl">
        {formatWelcome(displayName, locale)}
      </p>
      <p className="mt-1 text-sm text-gray-500">{dict.tagline}</p>
    </div>
  );
}
