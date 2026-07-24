import { prisma } from "@/lib/prisma";
import { getLocale, getDictionary } from "@/lib/i18n";
import { FloorPlan } from "@/components/org-structure/floor-plan";

export const dynamic = "force-dynamic";

export default async function FloorPlanPage() {
  const workplaces = await prisma.workplace.findMany({
    include: { employee: { include: { position: true, department: true } } },
    orderBy: [{ floor: "asc" }, { building: "asc" }, { room: "asc" }, { deskNumber: "asc" }],
  });

  const locale = getLocale();
  const dict = getDictionary(locale);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{dict.orgStructure.tabFloorPlan}</h1>
        <p className="text-sm text-gray-500">{dict.orgStructure.floorPlan.subtitle}</p>
      </div>
      <FloorPlan workplaces={workplaces} locale={locale} dict={dict.orgStructure} />
    </div>
  );
}
