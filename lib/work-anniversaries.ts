interface EmployeeForAnniversary {
  id: string;
  hireDate: Date | null;
}

/** Counts employees whose work anniversary (hireDate month/day, at least 1 full year in) falls within the next `daysAhead` days. Mirrors getUpcomingBirthdays() in lib/birthdays.ts but keyed on hireDate. */
export function countUpcomingWorkAnniversaries(employees: EmployeeForAnniversary[], daysAhead = 7): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let count = 0;

  for (const employee of employees) {
    if (!employee.hireDate) continue;
    const hire = new Date(employee.hireDate);

    const yearsIn = today.getFullYear() - hire.getFullYear();
    if (yearsIn < 1) continue;

    let nextOccurrence = new Date(today.getFullYear(), hire.getMonth(), hire.getDate());
    if (nextOccurrence < today) {
      nextOccurrence = new Date(today.getFullYear() + 1, hire.getMonth(), hire.getDate());
    }

    const daysUntil = Math.round((nextOccurrence.getTime() - today.getTime()) / 86_400_000);
    if (daysUntil <= daysAhead) count++;
  }

  return count;
}
