import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Cake, PartyPopper, UserPlus } from "lucide-react";
import { NewsList } from "@/components/home/news-list";
import { NearestBookingWidget } from "@/components/home/nearest-booking-widget";
import { HeroBanner } from "@/components/home/hero-banner";
import { BirthdaysWidget } from "@/components/home/birthdays-widget";
import { NewHiresWidget } from "@/components/home/new-hires-widget";
import { FeaturedNewsCarousel } from "@/components/home/featured-news-carousel";
import { HolidaysWidget } from "@/components/home/holidays-widget";
import { TodayCalendarWidget } from "@/components/home/today-calendar-widget";
import { CongratsWidget } from "@/components/home/congrats-widget";
import { AnnouncementsPanel } from "@/components/home/announcements-panel";
import { MyBnkCard } from "@/components/home/my-bnk-card";
import { getUpcomingBirthdays } from "@/lib/birthdays";
import { countUpcomingWorkAnniversaries } from "@/lib/work-anniversaries";
import { getLocale, getDictionary } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;
  const locale = getLocale();
  const dict = getDictionary(locale);

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const [
    news,
    newsCategories,
    nearestBooking,
    employeesWithBirthdays,
    upcomingHolidays,
    recentHires,
    todayBookings,
    newHiresThisWeek,
    employeesWithHireDate,
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
      prisma.employee.findMany({
        where: { hireDate: { not: null } },
        include: { position: true, department: true },
        orderBy: { hireDate: "desc" },
        take: 3,
      }),
      prisma.booking.findMany({
        where: { status: "CONFIRMED", startTime: { gte: startOfToday, lt: startOfTomorrow } },
        orderBy: { startTime: "asc" },
        include: { room: true },
      }),
      prisma.employee.count({ where: { hireDate: { gte: startOfWeek, lt: endOfWeek } } }),
      prisma.employee.findMany({ where: { hireDate: { not: null } }, select: { id: true, hireDate: true } }),
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
  const todayHoliday = upcomingHolidays.find((h) => h.date.getTime() === startOfToday.getTime()) ?? null;
  const workAnniversariesThisWeek = countUpcomingWorkAnniversaries(employeesWithHireDate);
  const employee = currentUser?.employee ?? null;
  const featuredNews = news.filter((item) => item.imageUrl).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <HeroBanner displayName={session!.user.name ?? ""} locale={locale} dict={dict.home} />
        <div className="space-y-4">
          {employee && (
            <MyBnkCard
              fullName={employee.fullName}
              positionTitle={employee.position?.title ?? null}
              departmentName={employee.department?.name ?? null}
              photoUrl={employee.photoUrl}
              title={dict.home.myBnk.title}
              profileLink={dict.home.myBnk.profileLink}
            />
          )}
        </div>
      </div>

      <FeaturedNewsCarousel items={featuredNews} dict={dict.home.featuredNews} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div>
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
        </div>
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">{dict.home.upcoming}</h2>
          <div className="space-y-4">
            <AnnouncementsPanel
              announcements={announcements}
              locale={locale}
              title={dict.home.announcements.title}
              emptyText={dict.home.announcements.empty}
              allLabel={dict.home.announcements.all}
              showMoreLabel={dict.home.announcements.showMore}
              showLessLabel={dict.home.announcements.showLess}
              closeLabel={dict.common.close}
            />
            <TodayCalendarWidget
              bookings={todayBookings}
              holiday={todayHoliday}
              locale={locale}
              title={dict.home.todayCalendar.title}
              emptyText={dict.home.todayCalendar.empty}
            />
            <CongratsWidget
              title={dict.home.congrats.title}
              tiles={[
                { icon: Cake, count: upcomingBirthdays.length, label: dict.home.congrats.birthdays },
                { icon: UserPlus, count: newHiresThisWeek, label: dict.home.congrats.newHires },
                { icon: PartyPopper, count: workAnniversariesThisWeek, label: dict.home.congrats.anniversaries },
              ]}
            />
            <BirthdaysWidget
              birthdays={upcomingBirthdays}
              locale={locale}
              dict={dict.home.birthdays}
              employeeModalDict={dict.orgStructure.employeeModal}
              common={dict.common}
            />
            <NewHiresWidget
              employees={recentHires}
              locale={locale}
              dict={dict.home.newHires}
              employeeModalDict={dict.orgStructure.employeeModal}
              common={dict.common}
            />
            <HolidaysWidget
              holidays={upcomingHolidays}
              locale={locale}
              title={dict.home.holidays.title}
            />
            <NearestBookingWidget
              booking={nearestBooking}
              locale={locale}
              dict={dict.home.nearestBooking}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
