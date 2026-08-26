import Link from "next/link";
import { getServerSession } from "next-auth";
import { Building2, CalendarClock, User } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getDictionary } from "@/lib/i18n";
import { EmployeeCard } from "@/components/org-structure/employee-card";
import { CompassChecklist } from "@/components/compass/compass-checklist";

export const dynamic = "force-dynamic";

export default async function CompassPage() {
  const session = await getServerSession(authOptions);
  const locale = getLocale();
  const dict = getDictionary(locale);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session!.user.id },
    include: {
      employee: { include: { department: true, position: true, workplace: true } },
    },
  });

  const [department, tips] = await Promise.all([
    user.employee
      ? prisma.department.findUnique({
          where: { id: user.employee.departmentId },
          include: { headEmployee: { include: { position: true } } },
        })
      : Promise.resolve(null),
    prisma.compassTip.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
  ]);

  const head = department?.headEmployee ?? null;

  const checklistItems = [
    { id: "profile", label: dict.compass.checklistProfile, href: "/profile" },
    { id: "org-structure", label: dict.compass.checklistOrgStructure, href: "/org-structure" },
    { id: "booking", label: dict.compass.checklistBooking, href: "/bookings" },
    { id: "links", label: dict.compass.checklistLinks, href: "/" },
  ];

  const quickLinks = [
    { href: "/org-structure", label: dict.compass.quickLinkOrgStructure, icon: Building2 },
    { href: "/bookings", label: dict.compass.quickLinkBooking, icon: CalendarClock },
    { href: "/profile", label: dict.compass.quickLinkProfile, icon: User },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{dict.compass.title}</h1>
        <p className="text-sm text-gray-500">{dict.compass.subtitle}</p>
      </div>

      <CompassChecklist userId={session!.user.id} items={checklistItems} title={dict.compass.checklistTitle} />

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 font-medium text-gray-900">{dict.compass.departmentTitle}</h2>
        {department ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">{department.name}</p>
            {head && <EmployeeCard employee={head} locale={locale} dict={dict.orgStructure.employeeModal} />}
            <Link
              href={`/org-structure/${department.id}`}
              className="inline-block text-sm text-brand-700 hover:underline dark:text-brand-300"
            >
              {dict.compass.openInOrgStructure}
            </Link>
          </div>
        ) : (
          <p className="text-sm text-gray-500">{dict.compass.notLinked}</p>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 font-medium text-gray-900">{dict.compass.quickLinksTitle}</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-700 transition hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/30"
            >
              <link.icon className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 font-medium text-gray-900">{dict.compass.tipsTitle}</h2>
        {tips.length === 0 ? (
          <p className="text-sm text-gray-500">{dict.compass.tipsEmpty}</p>
        ) : (
          <div className="space-y-3">
            {tips.map((tip) => (
              <div key={tip.id}>
                <p className="text-sm font-medium text-gray-900">{tip.title}</p>
                <p className="whitespace-pre-line text-sm text-gray-600">{tip.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
