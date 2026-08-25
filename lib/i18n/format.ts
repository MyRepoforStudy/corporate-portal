import type { Locale } from "./index";

// Parameterized strings live here as plain functions rather than as values
// inside the dictionary objects. Dictionaries get passed as props from
// Server Components into Client Components, and React Server Components
// cannot serialize functions across that boundary - only plain data.
// These functions are imported directly wherever needed instead.

export function formatWelcome(name: string, locale: Locale): string {
  switch (locale) {
    case "ko":
      return `${name}님, 환영합니다`;
    case "kk":
      return `Қош келдіңіз, ${name}`;
    default:
      return `Добро пожаловать, ${name}`;
  }
}

export function formatEmployeesCount(n: number, locale: Locale): string {
  switch (locale) {
    case "ko":
      return `${n}명`;
    case "kk":
      return `${n} қызметкер`;
    default:
      return `${n} сотр.`;
  }
}

export function formatBookingsCount(n: number, locale: Locale): string {
  switch (locale) {
    case "ko":
      return n > 0 ? `예약 ${n}건` : "예약 없음";
    case "kk":
      return n > 0 ? `${n} брондау` : "бос";
    default:
      return n > 0 ? `${n} бронь(ей)` : "свободно";
  }
}

export function formatFloor(n: number, locale: Locale): string {
  switch (locale) {
    case "ko":
      return `${n}층`;
    case "kk":
      return `${n}-қабат`;
    default:
      return `${n} этаж`;
  }
}

export function formatPageOf(page: number, totalPages: number, locale: Locale): string {
  switch (locale) {
    case "ko":
      return `${totalPages}쪽 중 ${page}쪽`;
    case "kk":
      return `${totalPages} беттің ${page}-беті`;
    default:
      return `Стр. ${page} из ${totalPages}`;
  }
}

export function formatCapacity(n: number, locale: Locale): string {
  switch (locale) {
    case "ko":
      return `최대 ${n}명`;
    case "kk":
      return `${n} адамға дейін`;
    default:
      return `до ${n} чел.`;
  }
}

// Hand-rolled instead of Intl.DateTimeFormat(locale, { month: "long" }) -
// kk-KZ has sparse CLDR coverage in some JS engines and silently falls back
// to a garbled format instead of throwing, so there's no reliable way to
// detect the failure at runtime. Static tables give the same correct output
// everywhere regardless of the runtime's ICU data.
const MONTH_LONG: Record<Locale, string[]> = {
  ru: [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
  ],
  kk: [
    "қаңтар", "ақпан", "наурыз", "сәуір", "мамыр", "маусым",
    "шілде", "тамыз", "қыркүйек", "қазан", "қараша", "желтоқсан",
  ],
  ko: [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월",
  ],
};

export function formatDateLong(date: Date | string, locale: Locale, withYear = false): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = d.getDate();
  const month = MONTH_LONG[locale][d.getMonth()];
  const year = d.getFullYear();

  if (locale === "ko") {
    const base = `${month} ${day}일`;
    return withYear ? `${year}년 ${base}` : base;
  }
  if (locale === "kk") {
    return withYear ? `${year} ж. ${day} ${month}` : `${day} ${month}`;
  }
  return withYear ? `${day} ${month} ${year} г.` : `${day} ${month}`;
}
