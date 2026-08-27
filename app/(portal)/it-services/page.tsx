import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getDictionary } from "@/lib/i18n";
import { EmployeeCard } from "@/components/org-structure/employee-card";
import { ItRequestForm } from "@/components/it-services/it-request-form";
import { formatDateLong } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

export default async function ItServicesPage() {
  const session = await getServerSession(authOptions);
  const locale = getLocale();
  const dict = getDictionary(locale);

  const [itDepartment, myRequests] = await Promise.all([
    prisma.department.findFirst({
      where: { name: { contains: "IT", mode: "insensitive" } },
      include: { headEmployee: { include: { position: true } } },
    }),
    prisma.itRequest.findMany({
      where: { requesterId: session!.user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{dict.itServices.title}</h1>
        <p className="text-sm text-gray-500">{dict.itServices.subtitle}</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-3 font-medium text-gray-900">{dict.itServices.contactTitle}</h2>
        {itDepartment?.headEmployee ? (
          <EmployeeCard employee={itDepartment.headEmployee} locale={locale} dict={dict.orgStructure.employeeModal} />
        ) : (
          <p className="text-sm text-gray-500">{dict.itServices.contactFallback}</p>
        )}
      </div>

      <ItRequestForm
        title={dict.itServices.formTitle}
        subjectPlaceholder={dict.itServices.subjectPlaceholder}
        descriptionPlaceholder={dict.itServices.descriptionPlaceholder}
        submitLabel={dict.itServices.submit}
        submittingLabel={dict.itServices.submitting}
        successMessage={dict.itServices.submitSuccess}
        errorMessage={dict.itServices.submitFailed}
      />

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-3 font-medium text-gray-900">{dict.itServices.myRequestsTitle}</h2>
        {myRequests.length === 0 ? (
          <p className="text-sm text-gray-500">{dict.itServices.myRequestsEmpty}</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {myRequests.map((request) => (
              <li key={request.id} className="py-2.5">
                <p className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  {request.subject}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      request.status === "OPEN"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                        : "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    }`}
                  >
                    {request.status === "OPEN" ? dict.itServices.statusOpen : dict.itServices.statusResolved}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-gray-500">{formatDateLong(request.createdAt, locale, true)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
