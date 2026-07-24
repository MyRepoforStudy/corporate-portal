import { getLocale, getDictionary } from "@/lib/i18n";
import { OrgStructureTabs } from "@/components/org-structure/org-structure-tabs";

export default function OrgStructureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = getLocale();
  const dict = getDictionary(locale);

  return (
    <div className="space-y-6">
      <OrgStructureTabs
        tabs={[
          { href: "/org-structure", label: dict.orgStructure.tabStructure },
          { href: "/org-structure/chart", label: dict.orgStructure.tabChart },
          { href: "/org-structure/workplaces", label: dict.orgStructure.tabWorkplaces },
          { href: "/org-structure/floor-plan", label: dict.orgStructure.tabFloorPlan },
          { href: "/org-structure/new-hires", label: dict.orgStructure.tabNewHires },
          { href: "/org-structure/birthdays", label: dict.orgStructure.tabBirthdays },
        ]}
      />
      {children}
    </div>
  );
}
