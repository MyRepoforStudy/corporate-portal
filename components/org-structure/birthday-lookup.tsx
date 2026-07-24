"use client";

import { useEffect, useState } from "react";
import { Cake } from "lucide-react";
import type { Department, Employee, Position } from "@prisma/client";
import type { Dictionary, Locale } from "@/lib/i18n";
import { toDateInputValue } from "@/lib/booking-time";
import { EmployeeCard } from "@/components/org-structure/employee-card";
import { SkeletonCards } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

type BirthdayResult = Employee & { position: Position; department: Department };

export function BirthdayLookup({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary["orgStructure"];
}) {
  const [dateValue, setDateValue] = useState(() => toDateInputValue(new Date()));
  const [results, setResults] = useState<BirthdayResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const [, month, day] = dateValue.split("-").map(Number);
    if (!month || !day) return;

    setIsLoading(true);
    const controller = new AbortController();
    fetch(`/api/employees/birthdays?month=${month}&day=${day}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : []))
      .then(setResults)
      .catch(() => {})
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [dateValue]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{dict.tabBirthdays}</h1>
        <p className="text-sm text-gray-500">{dict.birthdays.subtitle}</p>
      </div>

      <input
        type="date"
        value={dateValue}
        onChange={(e) => setDateValue(e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />

      {isLoading ? (
        <SkeletonCards count={3} />
      ) : results.length === 0 ? (
        <EmptyState icon={Cake} text={dict.birthdays.empty} />
      ) : (
        <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((employee) => (
            <div key={employee.id}>
              <p className="mb-1 truncate text-xs text-gray-500">{employee.department.name}</p>
              <EmployeeCard employee={employee} locale={locale} dict={dict.employeeModal} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
