"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";

export type HomeTab = "news" | "about";

/**
 * Which tab of the home page's left column is open ("Новости" / "О нас"). The
 * tab lives in the URL (`/?tab=about`, so a refresh or a shared link keeps it),
 * but switching only calls history.replaceState: Next.js (14.1+) syncs native
 * history calls with useSearchParams, so no request to the server is made.
 */
export function useHomeTab(): [HomeTab, (tab: HomeTab) => void] {
  const params = useSearchParams();
  const tab: HomeTab = params.get("tab") === "about" ? "about" : "news";

  const setTab = useCallback((next: HomeTab) => {
    const url = new URL(window.location.href);
    if (next === "about") url.searchParams.set("tab", "about");
    else url.searchParams.delete("tab");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, []);

  return [tab, setTab];
}
