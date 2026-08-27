import Link from "next/link";
import type { Session } from "next-auth";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { GlobalSearch } from "@/components/layout/global-search";
import { NotificationsBell } from "@/components/layout/notifications-bell";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { Theme } from "@/lib/theme";

export function Header({
  session,
  dict,
  locale,
  theme,
  photoUrl,
  departmentName,
}: {
  session: Session;
  dict: Dictionary;
  locale: Locale;
  theme: Theme;
  photoUrl: string | null;
  departmentName: string | null;
}) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-3 lg:px-10">
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="BNK Commercial Bank" className="h-7 w-auto" />
        </Link>
        <div className="hidden flex-1 justify-center px-6 md:flex">
          <GlobalSearch dict={dict.search} />
        </div>
        <div className="flex items-center gap-3">
          <NotificationsBell dict={dict.notifications} />
          <ThemeToggle theme={theme} dict={dict.common} />
          <LanguageSwitcher locale={locale} />
          <div className="hidden items-center gap-2 sm:flex">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="" className="h-8 w-8 rounded-full border border-gray-200 object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-xs font-medium text-gray-500">
                {(session.user.name ?? "?").charAt(0)}
              </div>
            )}
            <div className="leading-tight">
              <p className="text-sm text-gray-700">{session.user.name}</p>
              {departmentName && <p className="text-xs text-gray-400">{departmentName}</p>}
            </div>
          </div>
          <SignOutButton label={dict.nav.signOut} />
        </div>
      </div>
    </header>
  );
}
