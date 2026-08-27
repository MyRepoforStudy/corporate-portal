"use client";

import { useEffect, useState } from "react";
import type { ItRequest } from "@prisma/client";

type ItRequestWithRequester = ItRequest & { requester: { displayName: string; email: string } };

export function ItRequestsAdmin() {
  const [items, setItems] = useState<ItRequestWithRequester[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/it-requests");
      if (res.ok) setItems(await res.json());
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function resolve(id: string) {
    setError(null);
    const res = await fetch(`/api/admin/it-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RESOLVED" }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Не удалось изменить статус");
      return;
    }
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">IT-заявки</h1>
        <p className="text-sm text-gray-500">Заявки сотрудников в IT, отправленные со страницы «IT-сервисы».</p>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-gray-500">Загрузка...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">Заявок пока нет.</p>
      ) : (
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  {item.subject}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      item.status === "OPEN"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                        : "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    }`}
                  >
                    {item.status === "OPEN" ? "Открыта" : "Решена"}
                  </span>
                </p>
                <p className="mt-0.5 whitespace-pre-line text-sm text-gray-600">{item.description}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {item.requester.displayName} · {item.requester.email}
                </p>
              </div>
              {item.status === "OPEN" && (
                <button
                  onClick={() => resolve(item.id)}
                  className="shrink-0 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-brand-700 hover:border-brand-300 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/40"
                >
                  Отметить решённой
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
