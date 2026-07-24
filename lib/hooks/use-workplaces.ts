"use client";

import { useEffect, useState } from "react";
import type { EmployeeWithWorkplace } from "@/types/workplace";

export interface WorkplacesResponse {
  items: EmployeeWithWorkplace[];
  total: number;
  page: number;
  pageSize: number;
  floors: number[];
  buildings: string[];
}

export function useWorkplaces(query: string) {
  const [data, setData] = useState<WorkplacesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch(`/api/workplaces?${query}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? "Не удалось загрузить данные");
        }
        return (await res.json()) as WorkplacesResponse;
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  return { data, isLoading, error };
}
