import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewsList } from "@/components/home/news-list";
import { HeroBanner } from "@/components/home/hero-banner";
import { PeopleWidget } from "@/components/home/people-widget";
import { CalendarWidget } from "@/components/home/calendar-widget";
import { AnnouncementsPanel } from "@/components/home/announcements-panel";
import { MyBnkCard } from "@/components/home/my-bnk-card";
import { AutoRefresh } from "@/components/home/auto-refresh";
import { Reveal } from "@/components/ui/reveal";
import { getUpcomingBirthdays } from "@/lib/birthdays";
import { getNewHireWindow } from "@/lib/new-hires";
import { getLocale, getDictionary } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;
  const locale = getLocale();
  const dict = getDictionary(locale);

  const hireWindow = getNewHireWindow();

  const [
    news,
    newsCategories,
    nearestBooking,
    employeesWithBirthdays,
    upcomingHolidays,
    recentHires,
    announcements,
    currentUser,
  ] = await Promise.all([
      prisma.news.findMany({
        where: { isPublished: true },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        take: 30,
        include: {
          category: true,
          _count: { select: { likes: true, comments: true } },
          likes: { where: { userId }, select: { id: true } },
        },
      }),
      prisma.newsCategory.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
      prisma.booking.findFirst({
        where: {
          status: "CONFIRMED",
          startTime: { gte: new Date() },
          OR: [{ organizerId: userId }, { participants: { some: { id: userId } } }],
        },
        orderBy: { startTime: "asc" },
        include: { room: true },
      }),
      prisma.employee.findMany({
        where: { birthDate: { not: null } },
        select: {
          id: true,
          fullName: true,
          birthDate: true,
          photoUrl: true,
          email: true,
          phone: true,
          position: { select: { title: true } },
        },
      }),
      prisma.holiday.findMany({
        where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        orderBy: { date: "asc" },
        take: 3,
      }),
      // Only people hired in the last few days (lib/new-hires.ts): a new hire
      // does not stay on the home page forever.
      prisma.employee.findMany({
        where: { hireDate: { gte: hireWindow.from, lt: hireWindow.to } },
        include: { position: true, department: true },
        orderBy: { hireDate: "desc" },
      }),
      prisma.announcement.findMany({
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        take: 10,
      }),
      prisma.user.findUnique({
        where: { id: userId },
        include: { employee: { include: { department: true, position: true } } },
      }),
    ]);

  const upcomingBirthdays = getUpcomingBirthdays(employeesWithBirthdays);
  const employee = currentUser?.employee ?? null;

  return (
    <div className="space-y-6">
      <AutoRefresh />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <Reveal index={0} className="h-full">
          <HeroBanner displayName={session!.user.name ?? ""} locale={locale} dict={dict.home} />
        </Reveal>
        {employee && (
          <Reveal index={1} className="h-full">
            <MyBnkCard
              fullName={employee.fullName}
              positionTitle={employee.position?.title ?? null}
              departmentName={employee.department?.name ?? null}
              photoUrl={employee.photoUrl}
              title={dict.home.myBnk.title}
              profileLink={dict.home.myBnk.profileLink}
            />
          </Reveal>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <Reveal index={2}>
          <NewsList
            news={news}
            categories={newsCategories}
            locale={locale}
            title={dict.home.news}
            emptyText={dict.home.noNews}
            newBadge={dict.home.newBadge}
            common={dict.common}
            dict={dict.newsBoard}
          />
        </Reveal>
        <div>
          <Reveal index={3}>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">{dict.home.upcoming}</h2>
          </Reveal>
          <div className="space-y-4">
            <Reveal index={3}>
              <AnnouncementsPanel
                announcements={announcements}
                locale={locale}
                title={dict.home.announcements.title}
                emptyText={dict.home.announcements.empty}
                showMoreLabel={dict.home.announcements.showMore}
                showLessLabel={dict.home.announcements.showLess}
                closeLabel={dict.common.close}
              />
            </Reveal>
            <Reveal index={4}>
              <PeopleWidget
                birthdays={upcomingBirthdays}
                hires={recentHires}
                locale={locale}
                dict={dict.home}
                employeeModalDict={dict.orgStructure.employeeModal}
                common={dict.common}
              />
            </Reveal>
            <Reveal index={5}>
              <CalendarWidget
                holidays={upcomingHolidays}
                booking={nearestBooking}
                locale={locale}
                dict={dict.home}
              />
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  );
}
