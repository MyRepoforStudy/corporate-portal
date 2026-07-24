import { UserPlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getLocale, getDictionary } from "@/lib/i18n";
import { NewHireCard } from "@/components/org-structure/new-hire-card";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function NewHiresPage() {
  const employees = await prisma.employee.findMany({
    where: { hireDate: { not: null } },
    include: { position: true, department: true },
    orderBy: { hireDate: "desc" },
  });

  const locale = getLocale();
  const dict = getDictionary(locale);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{dict.orgStructure.tabNewHires}</h1>
        <p className="text-sm text-gray-500">{dict.orgStructure.newHires.subtitle}</p>
      </div>
      {employees.length === 0 ? (
        <EmptyState icon={UserPlus} text={dict.orgStructure.newHires.empty} />
      ) : (
        <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {employees.map((employee) => (
            <NewHireCard key={employee.id} employee={employee} locale={locale} dict={dict.orgStructure} />
          ))}
        </div>
      )}
    </div>
  );
}
