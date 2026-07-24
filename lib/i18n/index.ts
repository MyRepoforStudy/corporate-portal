import { cookies } from "next/headers";
import { ru, type Dictionary } from "./ru";
import { ko } from "./ko";
import { kk } from "./kk";

export type Locale = "kk" | "ru" | "ko";
export const LOCALES: Locale[] = ["kk", "ru", "ko"];
export const LOCALE_COOKIE = "NEXT_LOCALE";

const dictionaries: Record<Locale, Dictionary> = { kk, ru, ko };

export function getLocale(): Locale {
  const value = cookies().get(LOCALE_COOKIE)?.value;
  return value === "ko" || value === "kk" ? value : "ru";
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
