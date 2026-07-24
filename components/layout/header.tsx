import Link from "next/link";
import type { Session } from "next-auth";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { GlobalSearch } from "@/components/layout/global-search";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { Theme } from "@/lib/theme";

export function Header({
  session,
  dict,
  locale,
  theme,
}: {
  session: Session;
  dict: Dictionary;
  locale: Locale;
  theme: Theme;
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
          <ThemeToggle theme={theme} />
          <LanguageSwitcher locale={locale} />
          <span className="hidden text-sm text-gray-500 sm:inline">{session.user.name}</span>
          <SignOutButton label={dict.nav.signOut} />
        </div>
      </div>
    </header>
  );
}
