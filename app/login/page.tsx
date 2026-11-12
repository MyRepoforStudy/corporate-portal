import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { BrandPattern } from "@/components/ui/brand-pattern";
import { Reveal } from "@/components/ui/reveal";
import { getLocale, getDictionary } from "@/lib/i18n";
import { getTheme } from "@/lib/theme";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/");
  }

  const locale = getLocale();
  const dict = getDictionary(locale);
  const theme = getTheme();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* Brand panel - only where there is room for it (below lg the form stands alone, as before) */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 p-12 lg:flex xl:p-16">
        <BrandPattern variant="panel" />
        <Reveal className="relative">
          {/* fixed white (not bg-white, which turns dark in dark mode): the logo's colors are made for a light background */}
          <span className="inline-flex rounded-lg bg-[#ffffff] px-4 py-3 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="BNK Commercial Bank" className="h-8 w-auto" />
          </span>
        </Reveal>
        <Reveal index={1} className="relative max-w-lg">
          <p className="text-3xl font-semibold leading-tight text-white xl:text-4xl">{dict.home.tagline}</p>
        </Reveal>
      </section>

      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <Reveal index={1} className="w-full max-w-sm">
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm lg:border-0 lg:p-0 lg:shadow-none">
            <div className="mb-6 flex items-center justify-between">
              {/* the logo is in the brand panel from lg up */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="BNK Commercial Bank" className="h-7 w-auto lg:hidden" />
              <div className="flex items-center gap-2 lg:ml-auto">
                <ThemeToggle theme={theme} dict={dict.common} />
                <LanguageSwitcher locale={locale} />
              </div>
            </div>
            <h1 className="mb-1 text-xl font-semibold text-gray-900">{dict.login.title}</h1>
            <p className="mb-6 text-sm text-gray-500">{dict.login.subtitle}</p>
            <LoginForm callbackUrl={searchParams.callbackUrl ?? "/"} dict={dict.login} />
          </div>
        </Reveal>
      </main>
    </div>
  );
}
