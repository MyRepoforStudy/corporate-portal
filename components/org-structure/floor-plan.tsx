import { Users } from "lucide-react";
import type { Department, Employee, Position, Workplace } from "@prisma/client";
import { EmployeeCard } from "@/components/org-structure/employee-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { Dictionary, Locale } from "@/lib/i18n";

type WorkplaceWithEmployee = Workplace & {
  employee: Employee & { position: Position; department: Department };
};

export function FloorPlan({
  workplaces,
  locale,
  dict,
}: {
  workplaces: WorkplaceWithEmployee[];
  locale: Locale;
  dict: Dictionary["orgStructure"];
}) {
  if (workplaces.length === 0) {
    return <EmptyState icon={Users} text={dict.floorPlan.empty} />;
  }

  const floorGroups = new Map<string, { building: string | null; floor: number; items: WorkplaceWithEmployee[] }>();
  for (const wp of workplaces) {
    const key = `${wp.building ?? ""}__${wp.floor}`;
    if (!floorGroups.has(key)) {
      floorGroups.set(key, { building: wp.building, floor: wp.floor, items: [] });
    }
    floorGroups.get(key)!.items.push(wp);
  }

  return (
    <div className="space-y-8">
      {[...floorGroups.values()].map((group) => {
        const zones = new Map<string, WorkplaceWithEmployee[]>();
        for (const wp of group.items) {
          const zoneKey = wp.room || dict.floorPlan.noZone;
          if (!zones.has(zoneKey)) zones.set(zoneKey, []);
          zones.get(zoneKey)!.push(wp);
        }

        const floorLabel = group.building
          ? `${group.building} · ${dict.employeeModal.floor} ${group.floor}`
          : `${dict.employeeModal.floor} ${group.floor}`;

        return (
          <section key={`${group.building}-${group.floor}`}>
            <div className="mb-3 flex items-baseline gap-2">
              <h2 className="text-lg font-semibold text-gray-900">{floorLabel}</h2>
              <span className="text-sm text-gray-500">
                {group.items.length} {dict.floorPlan.seatsCount}
              </span>
            </div>
            <div className="space-y-4">
              {[...zones.entries()].map(([zoneName, items]) => (
                <div key={zoneName} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h3 className="mb-3 text-sm font-medium text-gray-700">{zoneName}</h3>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {items.map((wp) => (
                      <EmployeeCard key={wp.id} employee={wp.employee} locale={locale} dict={dict.employeeModal} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
