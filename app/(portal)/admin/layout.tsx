import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";

const ADMIN_LINKS = [
  { href: "/admin", label: "Обзор", adminOnly: false },
  { href: "/admin/news", label: "Новости", adminOnly: false },
  { href: "/admin/departments", label: "Отделы", adminOnly: false },
  { href: "/admin/positions", label: "Должности", adminOnly: false },
  { href: "/admin/employees", label: "Сотрудники", adminOnly: false },
  { href: "/admin/rooms", label: "Переговорные", adminOnly: false },
  { href: "/admin/import", label: "Импорт", adminOnly: false },
  { href: "/admin/team-spotlights", label: "Команда в деле", adminOnly: true },
  { href: "/admin/resource-links", label: "Ресурсы", adminOnly: true },
  { href: "/admin/bookings", label: "Бронирования", adminOnly: true },
  { href: "/admin/users", label: "Пользователи", adminOnly: true },
  { href: "/admin/audit-log", label: "Журнал", adminOnly: true },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "HR")) {
    redirect("/");
  }
  const isAdmin = session.user.role === "ADMIN";
  const links = ADMIN_LINKS.filter((link) => isAdmin || !link.adminOnly);

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <nav className="flex shrink-0 flex-row gap-1 overflow-x-auto md:w-48 md:flex-col">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
