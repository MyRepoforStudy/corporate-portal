import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Cake, UserPlus } from "lucide-react";
import { NewsList } from "@/components/home/news-list";
import { NearestBookingWidget } from "@/components/home/nearest-booking-widget";
import { HeroBanner } from "@/components/home/hero-banner";
import { BirthdaysWidget } from "@/components/home/birthdays-widget";
import { NewHiresWidget } from "@/components/home/new-hires-widget";
import { HolidaysWidget } from "@/components/home/holidays-widget";
import { CongratsWidget } from "@/components/home/congrats-widget";
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
        <div className="space-y-4">
          {employee && (
            <Reveal index={1}>
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
              <CongratsWidget
                title={dict.home.congrats.title}
                tiles={[
                  { icon: Cake, count: upcomingBirthdays.length, label: dict.home.congrats.birthdays },
                  { icon: UserPlus, count: recentHires.length, label: dict.home.congrats.newHires },
                ]}
                countDelay={4 * 70 + 120}
              />
            </Reveal>
            <Reveal index={5}>
              <BirthdaysWidget
                birthdays={upcomingBirthdays}
                locale={locale}
                dict={dict.home.birthdays}
                employeeModalDict={dict.orgStructure.employeeModal}
                common={dict.common}
              />
            </Reveal>
            <Reveal index={6}>
              <NewHiresWidget
                employees={recentHires}
                locale={locale}
                dict={dict.home.newHires}
                employeeModalDict={dict.orgStructure.employeeModal}
                common={dict.common}
              />
            </Reveal>
            {/* HolidaysWidget renders nothing without holidays: no empty wrapper, or it would add a gap */}
            {upcomingHolidays.length > 0 && (
              <Reveal index={7}>
                <HolidaysWidget
                  holidays={upcomingHolidays}
                  locale={locale}
                  title={dict.home.holidays.title}
                />
              </Reveal>
            )}
            <Reveal index={8}>
              <NearestBookingWidget
                booking={nearestBooking}
                locale={locale}
                dict={dict.home.nearestBooking}
              />
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  );
}
