export interface UpcomingBirthday {
  id: string;
  fullName: string;
  photoUrl: string | null;
  email: string;
  phone: string | null;
  positionTitle: string;
  nextOccurrence: Date;
}

interface EmployeeForBirthday {
  id: string;
  fullName: string;
  birthDate: Date | null;
  photoUrl: string | null;
  email: string;
  phone: string | null;
  position: { title: string };
}

/** Finds employees whose birthday (month/day, year ignored) falls within the next `daysAhead` days. */
export function getUpcomingBirthdays(employees: EmployeeForBirthday[], daysAhead = 7): UpcomingBirthday[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming: UpcomingBirthday[] = [];

  for (const employee of employees) {
    if (!employee.birthDate) continue;
    const birth = new Date(employee.birthDate);

    let nextOccurrence = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    if (nextOccurrence < today) {
      nextOccurrence = new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate());
    }

    const daysUntil = Math.round((nextOccurrence.getTime() - today.getTime()) / 86_400_000);
    if (daysUntil <= daysAhead) {
      upcoming.push({
        id: employee.id,
        fullName: employee.fullName,
        photoUrl: employee.photoUrl,
        email: employee.email,
        phone: employee.phone,
        positionTitle: employee.position.title,
        nextOccurrence,
      });
    }
  }

  return upcoming.sort((a, b) => a.nextOccurrence.getTime() - b.nextOccurrence.getTime());
}
