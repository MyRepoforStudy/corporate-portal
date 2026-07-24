"use client";

import { useCallback, useEffect, useState } from "react";

interface Identifiable {
  id: string;
}

export function useCrudList<T extends Identifiable>(endpoint: string) {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(endpoint);
      if (res.ok) {
        setItems(await res.json());
      }
    } finally {
      setIsLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function extractError(res: Response): Promise<string> {
    const body = await res.json().catch(() => null);
    return body?.error ?? "Что-то пошло не так";
  }

  async function create(data: unknown): Promise<string | null> {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return extractError(res);
    await reload();
    return null;
  }

  async function update(id: string, data: unknown): Promise<string | null> {
    const res = await fetch(`${endpoint}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return extractError(res);
    await reload();
    return null;
  }

  async function remove(id: string): Promise<string | null> {
    const res = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
    if (!res.ok) return extractError(res);
    await reload();
    return null;
  }

  return { items, isLoading, error, setError, reload, create, update, remove };
}
