import Link from "next/link";
import { Building2, CalendarClock, Compass, User } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getDictionary } from "@/lib/i18n";
import { EmployeeCard } from "@/components/org-structure/employee-card";
import { VacationCard } from "@/components/hr/vacation-card";

export const dynamic = "force-dynamic";

export default async function HrPage() {
  const session = await getServerSession(authOptions);
  const locale = getLocale();
  const dict = getDictionary(locale);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session!.user.id },
    include: { employee: true },
  });
  const employee = user.employee;

  const [department, hrDepartment] = await Promise.all([
    employee
      ? prisma.department.findUnique({
          where: { id: employee.departmentId },
          include: { headEmployee: { include: { position: true } } },
        })
      : Promise.resolve(null),
    prisma.department.findFirst({
      where: { name: { contains: "HR", mode: "insensitive" } },
      include: { headEmployee: { include: { position: true } } },
    }),
  ]);

  const quickLinks = [
    { href: "/org-structure", label: dict.hr.quickLinkOrgStructure, icon: Building2 },
    { href: "/compass", label: dict.hr.quickLinkCompass, icon: Compass },
    { href: "/bookings", label: dict.hr.quickLinkBooking, icon: CalendarClock },
    { href: "/profile", label: dict.hr.quickLinkProfile, icon: User },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{dict.hr.title}</h1>
        <p className="text-sm text-gray-500">{dict.hr.subtitle}</p>
      </div>

      {employee ? (
        <VacationCard
          total={employee.vacationDaysTotal}
          used={employee.vacationDaysUsed}
          title={dict.hr.vacationTitle}
          remainingLabel={dict.profile.vacationRemaining}
          ofTemplate={dict.profile.vacationOf}
        />
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">{dict.hr.notLinked}</p>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-3 font-medium text-gray-900">{dict.hr.departmentTitle}</h2>
        {department ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">{department.name}</p>
            {department.headEmployee && (
              <EmployeeCard employee={department.headEmployee} locale={locale} dict={dict.orgStructure.employeeModal} />
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">{dict.hr.notLinked}</p>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-3 font-medium text-gray-900">{dict.hr.contactTitle}</h2>
        {hrDepartment?.headEmployee ? (
          <EmployeeCard employee={hrDepartment.headEmployee} locale={locale} dict={dict.orgStructure.employeeModal} />
        ) : (
          <p className="text-sm text-gray-500">{dict.hr.contactFallback}</p>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-3 font-medium text-gray-900">{dict.hr.quickLinksTitle}</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
    </div>
  );
}
