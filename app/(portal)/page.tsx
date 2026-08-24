import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewsList } from "@/components/home/news-list";
import { NearestBookingWidget } from "@/components/home/nearest-booking-widget";
import { HeroBanner } from "@/components/home/hero-banner";
import { BirthdaysWidget } from "@/components/home/birthdays-widget";
import { NewHiresWidget } from "@/components/home/new-hires-widget";
import { TeamSpotlightCarousel } from "@/components/home/team-spotlight-carousel";
import { HolidaysWidget } from "@/components/home/holidays-widget";
import { getUpcomingBirthdays } from "@/lib/birthdays";
import { getLocale, getDictionary } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;
  const locale = getLocale();
  const dict = getDictionary(locale);

  const [
    news,
    nearestBooking,
    employeesWithBirthdays,
    upcomingHolidays,
    recentHires,
    teamSpotlights,
  ] = await Promise.all([
      prisma.news.findMany({
        where: { isPublished: true },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        take: 9,
      }),
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
        select: { id: true, fullName: true, birthDate: true, photoUrl: true, email: true, position: { select: { title: true } } },
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
      prisma.teamSpotlight.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] }),
    ]);

  const upcomingBirthdays = getUpcomingBirthdays(employeesWithBirthdays);

  return (
    <div className="space-y-6">
      <HeroBanner displayName={session!.user.name ?? ""} locale={locale} dict={dict.home} />

      <TeamSpotlightCarousel spotlights={teamSpotlights} dict={dict.home.teamSpotlight} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">{dict.home.news}</h2>
          <NewsList news={news} locale={locale} emptyText={dict.home.noNews} newBadge={dict.home.newBadge} />
        </div>
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">{dict.home.upcoming}</h2>
          <div className="space-y-4">
            <BirthdaysWidget
              birthdays={upcomingBirthdays}
              locale={locale}
              dict={dict.home.birthdays}
            />
            <NewHiresWidget employees={recentHires} dict={dict.home.newHires} />
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
