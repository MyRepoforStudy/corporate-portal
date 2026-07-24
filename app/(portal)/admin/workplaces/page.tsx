import { prisma } from "@/lib/prisma";
import { getLocale, getDictionary } from "@/lib/i18n";
import { WorkplaceExplorer } from "@/components/org-structure/workplace-explorer";

export const dynamic = "force-dynamic";

export default async function AdminWorkplacesPage() {
  const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });

  const locale = getLocale();
  const dict = getDictionary(locale);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{dict.workplaces.title}</h1>
        <p className="text-sm text-gray-500">{dict.workplaces.subtitle}</p>
      </div>
      <WorkplaceExplorer canEdit departments={departments} locale={locale} dict={dict.workplaces} />
    </div>
  );
}
