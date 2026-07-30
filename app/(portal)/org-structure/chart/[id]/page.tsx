import { prisma } from "@/lib/prisma";
import { buildDepartmentTree } from "@/lib/org-tree";
import { OrgChart } from "@/components/org-structure/org-chart";
import { getLocale, getDictionary } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function OrgChartDepartmentPage({ params }: { params: { id: string } }) {
  const [departments, employees, vacancies] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.employee.findMany({
      include: { position: true },
      orderBy: [{ position: { rank: "desc" } }, { fullName: "asc" }],
    }),
    prisma.vacancy.findMany({
      include: { position: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const tree = buildDepartmentTree(departments, employees, vacancies);
  const locale = getLocale();
  const dict = getDictionary(locale);

  return <OrgChart tree={tree} currentId={params.id} locale={locale} dict={dict.orgStructure} />;
}
