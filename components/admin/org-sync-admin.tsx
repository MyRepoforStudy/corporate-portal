"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast-provider";

interface OrgSyncResult {
  departmentsCreated: number;
  employeesCreated: number;
  employeesUpdated: number;
  skipped: { dn: string; reason: string }[];
}

export function OrgSyncAdmin() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [result, setResult] = useState<OrgSyncResult | null>(null);
  const toast = useToast();

  async function handleSync() {
    setIsSyncing(true);
    const res = await fetch("/api/admin/org-sync", { method: "POST" });
    setIsSyncing(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast(body?.error ?? "Не удалось синхронизировать с AD");
      return;
    }

    setResult(await res.json());
    toast("Синхронизация с AD завершена", "success");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Синхронизация с AD</h1>
        <p className="text-sm text-gray-500">
          Подтягивает отделы и сотрудников из Active Directory: иерархия отделов строится по
          структуре каталога, должность — по атрибуту title. Фото, рабочее место, отпуск и роли
          не затрагиваются.
        </p>
      </div>

      <button
        type="button"
        onClick={handleSync}
        disabled={isSyncing}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {isSyncing ? "Синхронизация..." : "Синхронизировать с AD"}
      </button>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Отделов создано</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{result.departmentsCreated}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Сотрудников создано</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{result.employeesCreated}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Сотрудников обновлено</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{result.employeesUpdated}</p>
            </div>
          </div>

          {result.skipped.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-gray-900">
                Пропущено ({result.skipped.length})
              </p>
              <div className="max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 font-medium text-gray-500">DN</th>
                      <th className="px-3 py-2 font-medium text-gray-500">Причина</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.skipped.map((row) => (
                      <tr key={row.dn}>
                        <td className="max-w-xs truncate px-3 py-2 text-gray-600">{row.dn}</td>
                        <td className="px-3 py-2 text-gray-600">{row.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
