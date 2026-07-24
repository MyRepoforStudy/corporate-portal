"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sun, Moon } from "lucide-react";
import { setTheme } from "@/lib/theme-actions";
import type { Theme } from "@/lib/theme";

export function ThemeToggle({ theme }: { theme: Theme }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle() {
    if (isPending) return;
    const next: Theme = theme === "dark" ? "light" : "dark";
    startTransition(async () => {
      await setTheme(next);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
