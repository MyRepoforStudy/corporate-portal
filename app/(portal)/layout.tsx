import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { IconSidebar } from "@/components/layout/icon-sidebar";
import { SideDecoration } from "@/components/layout/side-decoration";
import { ToastProvider } from "@/components/ui/toast-provider";
import { getLocale, getDictionary } from "@/lib/i18n";
import { getTheme } from "@/lib/theme";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const locale = getLocale();
  const dict = getDictionary(locale);
  const theme = getTheme();
  const resourceLinks = await prisma.resourceLink.findMany({ orderBy: [{ order: "asc" }, { title: "asc" }] });

  return (
    <ToastProvider>
      <SideDecoration />
      <div className="min-h-screen">
        <Header session={session} dict={dict} locale={locale} theme={theme} />
        <div className="mx-auto flex max-w-[1600px]">
          <IconSidebar dict={dict} isAdmin={session.user.role === "ADMIN"} resourceLinks={resourceLinks} />
          <main className="min-w-0 flex-1 px-6 py-6 lg:px-10">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
