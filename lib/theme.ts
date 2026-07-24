import { cookies } from "next/headers";

export type Theme = "light" | "dark";
export const THEME_COOKIE = "NEXT_THEME";

export function getTheme(): Theme {
  return cookies().get(THEME_COOKIE)?.value === "dark" ? "dark" : "light";
}
