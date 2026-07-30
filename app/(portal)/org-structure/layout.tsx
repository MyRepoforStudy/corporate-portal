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
        ]}
      />
      {children}
    </div>
  );
}
