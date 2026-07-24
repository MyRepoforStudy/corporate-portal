"use server";

import { cookies } from "next/headers";
import { THEME_COOKIE, type Theme } from "./theme";

export async function setTheme(theme: Theme) {
  cookies().set(THEME_COOKIE, theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
