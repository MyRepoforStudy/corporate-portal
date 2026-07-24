import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
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
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="BNK Commercial Bank" className="h-7 w-auto" />
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} />
            <LanguageSwitcher locale={locale} />
          </div>
        </div>
        <h1 className="mb-1 text-xl font-semibold text-gray-900">{dict.login.title}</h1>
        <p className="mb-6 text-sm text-gray-500">{dict.login.subtitle}</p>
        <LoginForm callbackUrl={searchParams.callbackUrl ?? "/"} dict={dict.login} />
      </div>
    </div>
  );
}
