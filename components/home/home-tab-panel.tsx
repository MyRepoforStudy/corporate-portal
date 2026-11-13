"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useHomeTab, type HomeTab } from "@/lib/hooks/use-home-tab";

/**
 * Content of one tab of the home page's left column. A tab that is not open is
 * only hidden, not unmounted (the news keep their category filter and likes).
 * `lazy`: nothing is rendered - and so nothing fetched - until the tab is opened
 * for the first time.
 */
export function HomeTabPanel({ tab, lazy = false, children }: { tab: HomeTab; lazy?: boolean; children: ReactNode }) {
  const [active] = useHomeTab();
  const [opened, setOpened] = useState(active === tab);

  useEffect(() => {
    if (active === tab) setOpened(true);
  }, [active, tab]);

  if (lazy && !opened && active !== tab) return null;

  return (
    <div id={`home-panel-${tab}`} role="tabpanel" aria-labelledby={`home-tab-${tab}-in-${tab}`} hidden={active !== tab} className="fade-in">
      {children}
    </div>
  );
}
