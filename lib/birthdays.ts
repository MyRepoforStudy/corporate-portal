/**
 * An imported birthday often has no year (the HR list gives only the day and the month), but Employee.birthDate
 * is a full date. An unknown year is stored as this leap year (so 29 February fits): an obviously synthetic value
 * that no colleague was born in. The portal only ever shows the day and the month of a birthday.
 */
export const UNKNOWN_BIRTH_YEAR = 1904;

/** Day and month at 12:00 UTC, so it is the same calendar day in every time zone from UTC-12 to UTC+11. */
export function birthDateOf(day: number, month: number, year: number = UNKNOWN_BIRTH_YEAR): Date {
  return new Date(Date.UTC(year, month - 1, day, 12));
}

export interface UpcomingBirthday {
  id: string;
  fullName: string;
  photoUrl: string | null;
  email: string;
  phone: string | null;
  positionTitle: string;
  /** This year's date of the birthday nearest to today: up to BIRTHDAY_DAYS_BEHIND days in the past. */
  occurrence: Date;
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

/** A birthday shows up this many days before it happens... */
export const BIRTHDAY_DAYS_AHEAD = 7;
/** ...and stays this many days after, so colleagues can still congratulate. Then it drops off the list. */
export const BIRTHDAY_DAYS_BEHIND = 2;

const DAY_MS = 86_400_000;

/**
 * Employees whose birthday (month/day, year ignored) falls within
 * [today - daysBehind, today + daysAhead]. The previous, current and next
 * year's occurrence are all checked, so the window works around New Year too.
 * Today's and upcoming birthdays come first, then the recent ones.
 * `now` is a parameter only so the logic can be tested at a fixed date.
 */
export function getUpcomingBirthdays(
  employees: EmployeeForBirthday[],
  daysAhead = BIRTHDAY_DAYS_AHEAD,
  daysBehind = BIRTHDAY_DAYS_BEHIND,
  now: Date = new Date()
): UpcomingBirthday[] {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const found: { birthday: UpcomingBirthday; offset: number }[] = [];

  for (const employee of employees) {
    if (!employee.birthDate) continue;
    const birth = new Date(employee.birthDate);
    if (Number.isNaN(birth.getTime())) continue;

    for (const year of [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1]) {
      const occurrence = new Date(year, birth.getMonth(), birth.getDate());
      // Days from today; rounding absorbs the 23/25-hour days around DST changes.
      const offset = Math.round((occurrence.getTime() - today.getTime()) / DAY_MS);
      if (offset >= -daysBehind && offset <= daysAhead) {
        found.push({
          offset,
          birthday: {
            id: employee.id,
            fullName: employee.fullName,
            photoUrl: employee.photoUrl,
            email: employee.email,
            phone: employee.phone,
            positionTitle: employee.position.title,
            occurrence,
          },
        });
        break;
      }
    }
  }

  // Not yet passed first (soonest first), then the recent ones (most recent first).
  const rank = (offset: number) => (offset >= 0 ? offset : 1000 - offset);
  return found.sort((a, b) => rank(a.offset) - rank(b.offset)).map((f) => f.birthday);
}
