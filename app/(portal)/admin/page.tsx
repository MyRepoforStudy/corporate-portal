import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [users, employees, departments, vacancies, rooms, upcomingBookings, news] = await Promise.all([
    prisma.user.count(),
    prisma.employee.count(),
    prisma.department.count(),
    prisma.vacancy.count(),
    prisma.room.count(),
    prisma.booking.count({ where: { status: "CONFIRMED", startTime: { gte: new Date() } } }),
    prisma.news.count(),
  ]);

  const cards = [
    { label: "Пользователи портала", value: users },
    { label: "Сотрудники в оргструктуре", value: employees },
    { label: "Отделов", value: departments },
    { label: "Открытых вакансий", value: vacancies },
    { label: "Переговорные комнаты", value: rooms },
    { label: "Предстоящие брони", value: upcomingBookings },
    { label: "Новости", value: news },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Обзор</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
