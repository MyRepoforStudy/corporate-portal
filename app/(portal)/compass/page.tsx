import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getDictionary } from "@/lib/i18n";
import { OnboardingInteractive } from "@/components/compass/onboarding-interactive";
import { TeamSection } from "@/components/compass/team-section";
import { TipsGrid } from "@/components/compass/tips-grid";
import { ResourceSection } from "@/components/compass/resource-section";
import { HelpSection, type HelpContact } from "@/components/compass/help-section";
import { FaqSection } from "@/components/compass/faq-section";

export const dynamic = "force-dynamic";

export default async function CompassPage() {
  const session = await getServerSession(authOptions);
  const locale = getLocale();
  const dict = getDictionary(locale);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session!.user.id },
    include: {
      employee: { include: { department: true, position: true, workplace: true } },
    },
  });

  const employee = user.employee;

  const [department, colleagues, hrDepartment, itDepartment, resourceLinks, tips, tasks, faqItems] = await Promise.all([
    employee
      ? prisma.department.findUnique({
          where: { id: employee.departmentId },
          include: { headEmployee: { include: { position: true } } },
        })
      : Promise.resolve(null),
    employee
      ? prisma.employee.findMany({
          where: { departmentId: employee.departmentId, id: { not: employee.id } },
          include: { position: true },
          orderBy: [{ position: { rank: "desc" } }, { fullName: "asc" }],
          take: 6,
        })
      : Promise.resolve([]),
    prisma.department.findFirst({
      where: { name: { contains: "HR", mode: "insensitive" } },
      include: { headEmployee: { include: { position: true } } },
    }),
    prisma.department.findFirst({
      where: { name: { contains: "IT", mode: "insensitive" } },
      include: { headEmployee: { include: { position: true } } },
    }),
    prisma.resourceLink.findMany({ orderBy: [{ order: "asc" }, { title: "asc" }] }),
    prisma.compassTip.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
    prisma.onboardingTask.findMany({ orderBy: [{ stageId: "asc" }, { order: "asc" }] }),
    prisma.faqItem.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
  ]);

  const managerContact: HelpContact = {
    label: dict.compass.helpManagerLabel,
    employee: department?.headEmployee ?? null,
    fallbackText: dict.compass.helpManagerFallback,
  };
  const hrContact: HelpContact = {
    label: dict.compass.helpHrLabel,
    employee: hrDepartment?.headEmployee ?? null,
    fallbackText: dict.compass.helpHrFallback,
  };
  const itContact: HelpContact = {
    label: dict.compass.helpItLabel,
    employee: itDepartment?.headEmployee ?? null,
    fallbackText: dict.compass.helpItFallback,
  };

  return (
    <div className="max-w-4xl space-y-6">
      {employee ? (
        <OnboardingInteractive
          userId={session!.user.id}
          fullName={employee.fullName}
          positionTitle={employee.position.title}
          departmentName={employee.department.name}
          hireDate={employee.hireDate}
          photoUrl={employee.photoUrl}
          tasks={tasks}
          locale={locale}
          dict={dict.compass}
          common={dict.common}
        />
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h1 className="text-lg font-semibold text-gray-900">{dict.compass.title.replace("{name}", user.displayName)}</h1>
          <p className="mt-2 text-sm text-gray-500">{dict.compass.notLinked}</p>
        </div>
      )}

      <TeamSection
        colleagues={colleagues}
        locale={locale}
        dict={dict.orgStructure.employeeModal}
        title={dict.compass.teamTitle}
        emptyText={dict.compass.teamEmpty}
      />

      <TipsGrid tips={tips} title={dict.compass.tipsTitle} emptyText={dict.compass.tipsEmpty} />

      <ResourceSection
        resources={resourceLinks}
        title={dict.compass.resourcesTitle}
        emptyText={dict.compass.resourcesEmpty}
        openLabel={dict.compass.openButton}
      />

      <HelpSection
        contacts={[hrContact, itContact, managerContact]}
        title={dict.compass.helpTitle}
        subtitle={dict.compass.helpSubtitle}
        contactLabel={dict.compass.contactButton}
      />

      <FaqSection items={faqItems} title={dict.compass.faqTitle} emptyText={dict.compass.faqEmpty} />
    </div>
  );
}
