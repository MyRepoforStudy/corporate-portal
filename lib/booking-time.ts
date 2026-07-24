import type { Locale } from "@/lib/i18n";

export const DAY_START_HOUR = 8;
export const DAY_END_HOUR = 20;

// Hand-rolled instead of Intl.DateTimeFormat({ weekday: "short", month: "short" })
// - kk-KZ has sparse CLDR coverage in some JS engines and silently falls
// back to a garbled format ("M07 6, Mon") instead of throwing, so there's
// no reliable way to detect the failure at runtime. Static tables give the
// same correct output everywhere regardless of the runtime's ICU data.
const WEEKDAY_SHORT: Record<Locale, string[]> = {
  ru: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
  kk: ["Жс", "Дс", "Сс", "Ср", "Бс", "Жм", "Сб"],
  ko: ["일", "월", "화", "수", "목", "금", "토"],
};

const MONTH_SHORT: Record<Locale, string[]> = {
  ru: ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"],
  kk: ["қаң", "ақп", "нау", "сәу", "мам", "мау", "шіл", "там", "қыр", "қаз", "қар", "жел"],
  ko: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
};

export function toDateInputValue(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  return addDays(d, -day);
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function formatDayLabel(date: Date, locale: Locale = "ru"): string {
  const weekday = WEEKDAY_SHORT[locale][date.getDay()];
  const month = MONTH_SHORT[locale][date.getMonth()];
  return `${weekday} ${date.getDate()} ${month}`;
}

/** Returns { topPercent, heightPercent } clamped to the visible business-hours window. */
export function positionInDay(startTime: Date | string, endTime: Date | string) {
  const start = typeof startTime === "string" ? new Date(startTime) : startTime;
  const end = typeof endTime === "string" ? new Date(endTime) : endTime;

  const windowStart = DAY_START_HOUR * 60;
  const windowEnd = DAY_END_HOUR * 60;
  const windowLength = windowEnd - windowStart;

  const startMinutes = Math.min(
    Math.max(start.getHours() * 60 + start.getMinutes(), windowStart),
    windowEnd
  );
  const endMinutes = Math.min(
    Math.max(end.getHours() * 60 + end.getMinutes(), windowStart),
    windowEnd
  );

  const topPercent = ((startMinutes - windowStart) / windowLength) * 100;
  const heightPercent = Math.max(((endMinutes - startMinutes) / windowLength) * 100, 2);

  return { topPercent, heightPercent };
}
