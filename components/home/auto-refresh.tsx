"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Re-fetches the server-rendered page every `minutes`, and when the tab comes
 * back into view after that long. The home page's dated blocks (birthdays,
 * announcements) are computed once per page load, so without this a tab that
 * stays open for days keeps showing yesterday's data.
 */
export function AutoRefresh({ minutes = 60 }: { minutes?: number }) {
  const router = useRouter();

  useEffect(() => {
    const intervalMs = minutes * 60_000;
    let lastRefresh = Date.now();

    const refresh = () => {
      lastRefresh = Date.now();
      router.refresh();
    };
    const timer = setInterval(refresh, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - lastRefresh >= intervalMs) refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [minutes, router]);

  return null;
}
