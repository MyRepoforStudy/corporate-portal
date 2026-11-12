"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sun, Moon } from "lucide-react";
import { setTheme } from "@/lib/theme-actions";
import type { Theme } from "@/lib/theme";
import type { Dictionary } from "@/lib/i18n";

export function ThemeToggle({ theme, dict }: { theme: Theme; dict: Dictionary["common"] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // The icon only turns after a click, not on every page load.
  const [hasToggled, setHasToggled] = useState(false);

  // `theme` changes when the refreshed page arrives with the new colors: let the
  // color fade play out, then drop the class that enables it (see .theme-transition).
  // It lives on <body> because React owns the className of <html> and would wipe it.
  useEffect(() => {
    const timer = window.setTimeout(() => document.body.classList.remove("theme-transition"), 500);
    return () => window.clearTimeout(timer);
  }, [theme]);

  function toggle() {
    if (isPending) return;
    const next: Theme = theme === "dark" ? "light" : "dark";
    setHasToggled(true);
    document.body.classList.add("theme-transition");
    // If switching fails nothing changes and the effect above never runs: do not leave the class behind.
    window.setTimeout(() => document.body.classList.remove("theme-transition"), 4000);
    startTransition(async () => {
      await setTheme(next);
      router.refresh();
    });
  }

  const iconClass = `h-4 w-4 ${hasToggled ? "icon-spin-in" : ""}`;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? dict.switchToLightTheme : dict.switchToDarkTheme}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
    >
      {theme === "dark" ? (
        <Sun className={iconClass} aria-hidden="true" />
      ) : (
        <Moon className={iconClass} aria-hidden="true" />
      )}
    </button>
  );
}
