"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

/** How often the bell looks for new notifications (only while the tab is visible). */
const POLL_MS = 60_000;

export function NotificationsBell({
  dict,
}: {
  dict: { title: string; empty: string; markAllRead: string };
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  // Bumped whenever more unread notifications than before are found: the bell rings once.
  const [ringKey, setRingKey] = useState(0);
  const previousUnread = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setItems(data.notifications);
        setUnreadCount(data.unreadCount);
        if (data.unreadCount > previousUnread.current) setRingKey((k) => k + 1);
        previousUnread.current = data.unreadCount;
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleOpen() {
    setIsOpen((prev) => !prev);
  }

  async function handleMarkAllRead() {
    setUnreadCount(0);
    previousUnread.current = 0;
    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    await fetch("/api/notifications/read-all", { method: "PATCH" });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        aria-label={dict.title}
        className="relative rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      >
        <Bell key={ringKey} className={`h-5 w-5 ${ringKey > 0 ? "bell-ring" : ""}`} aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            key={unreadCount}
            className="badge-pop absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-medium text-white"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="popover-enter absolute right-0 top-full z-30 mt-2 w-80 origin-top-right rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
            <span className="text-sm font-medium text-gray-900">{dict.title}</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-brand-700 hover:underline dark:text-brand-300">
                {dict.markAllRead}
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-gray-500">{dict.empty}</p>
            ) : (
              items.map((item) => {
                const content = (
                  <div className={`px-3 py-2.5 text-sm ${item.isRead ? "" : "bg-brand-50 dark:bg-brand-900/20"}`}>
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-600">{item.message}</p>
                  </div>
                );
                return item.link ? (
                  <Link key={item.id} href={item.link} onClick={() => setIsOpen(false)} className="block hover:bg-gray-50">
                    {content}
                  </Link>
                ) : (
                  <div key={item.id}>{content}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
