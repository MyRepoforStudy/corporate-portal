/** A new employee stays on the home page for this many days, counting the hire date itself. */
export const NEW_HIRE_DAYS_VISIBLE = 3;

/**
 * Hire-date range `[from, to)` of the employees who count as "new" at `now`:
 * hired today or in the previous `days - 1` days. A hire date in the future
 * (HR entered the record in advance) stays hidden until that day arrives, and
 * once the days are over the person drops off the list. `now` is a parameter
 * only so the logic can be tested at a fixed date.
 */
export function getNewHireWindow(
  now: Date = new Date(),
  days: number = NEW_HIRE_DAYS_VISIBLE
): { from: Date; to: Date } {
  const to = new Date(now);
  to.setHours(0, 0, 0, 0);
  to.setDate(to.getDate() + 1); // start of tomorrow (exclusive)

  const from = new Date(to);
  from.setDate(from.getDate() - days); // start of the first visible day
  return { from, to };
}
