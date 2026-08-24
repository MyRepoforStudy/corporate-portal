import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getDictionary } from "@/lib/i18n";
import { CalendarView } from "@/components/calendar/calendar-view";

export const dynamic = "force-dynamic";

function parseMonthParam(month: string | undefined): { year: number; month: number } {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    if (m >= 1 && m <= 12) return { year: y, month: m - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const session = await getServerSession(authOptions);
  const { year, month } = parseMonthParam(searchParams.month);
  const locale = getLocale();
  const dict = getDictionary(locale);

  const monthStart = new Date(year, month, 1);
  const monthEndExclusive = new Date(year, month + 1, 1);

  const [holidays, vacations] = await Promise.all([
    prisma.holiday.findMany({
      where: { date: { gte: monthStart, lt: monthEndExclusive } },
      orderBy: { date: "asc" },
    }),
    prisma.vacation.findMany({
      where: { startDate: { lt: monthEndExclusive }, endDate: { gte: monthStart } },
      include: { employee: { select: { id: true, fullName: true, photoUrl: true } } },
      orderBy: { startDate: "asc" },
    }),
  ]);

  const canManage = session!.user.role === "ADMIN" || session!.user.role === "HR";

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">{dict.calendar.pageTitle}</h1>
      <CalendarView
        year={year}
        month={month}
        holidays={holidays}
        vacations={vacations}
        canManage={canManage}
        locale={locale}
        dict={dict.calendar}
        common={dict.common}
      />
    </div>
  );
}
