import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { IconSidebar } from "@/components/layout/icon-sidebar";
import { SideDecoration } from "@/components/layout/side-decoration";
import { PortalBackground } from "@/components/layout/portal-background";
import { ToastProvider } from "@/components/ui/toast-provider";
import { getAppearance } from "@/lib/appearance-db";
import { getLocale, getDictionary } from "@/lib/i18n";
import { getTheme } from "@/lib/theme";
import { hasBookingAccess } from "@/lib/booking-access";

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
  const [resourceLinks, user, appearance] = await Promise.all([
    prisma.resourceLink.findMany({ orderBy: [{ order: "asc" }, { title: "asc" }] }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: { employee: { include: { department: true } } },
    }),
    getAppearance(),
  ]);

  const canBook = hasBookingAccess({ role: session.user.role, canBookRooms: user?.canBookRooms });

  return (
    <ToastProvider>
      <PortalBackground appearance={appearance} />
      <SideDecoration />
      <div className="min-h-screen">
        <Header
          session={session}
          dict={dict}
          locale={locale}
          theme={theme}
          photoUrl={user?.employee?.photoUrl ?? null}
          departmentName={user?.employee?.department.name ?? null}
        />
        <div className="mx-auto flex max-w-[1600px]">
          <IconSidebar
            dict={dict}
            canAccessAdmin={session.user.role === "ADMIN" || session.user.role === "HR"}
            canBook={canBook}
            resourceLinks={resourceLinks}
          />
          <main className="min-w-0 flex-1 px-6 py-6 lg:px-10">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
