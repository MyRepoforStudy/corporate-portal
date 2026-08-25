"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const ACTION_OPTIONS = [
  { value: "CREATE", label: "Создание" },
  { value: "UPDATE", label: "Изменение" },
  { value: "DELETE", label: "Удаление" },
];

export function AuditLogFilters({
  entityTypes,
  actors,
}: {
  entityTypes: string[];
  actors: { id: string; displayName: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilters = ["action", "entityType", "actorId", "from", "to"].some((key) =>
    searchParams.get(key)
  );

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs text-gray-500">Действие</label>
        <select
          value={searchParams.get("action") ?? ""}
          onChange={(e) => updateParam("action", e.target.value)}
          className="rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">Все действия</option>
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs text-gray-500">Раздел</label>
        <select
          value={searchParams.get("entityType") ?? ""}
          onChange={(e) => updateParam("entityType", e.target.value)}
          className="rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">Все разделы</option>
          {entityTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs text-gray-500">Пользователь</label>
        <select
          value={searchParams.get("actorId") ?? ""}
          onChange={(e) => updateParam("actorId", e.target.value)}
          className="rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">Все пользователи</option>
          {actors.map((actor) => (
            <option key={actor.id} value={actor.id}>
              {actor.displayName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs text-gray-500">С</label>
        <input
          type="date"
          value={searchParams.get("from") ?? ""}
          onChange={(e) => updateParam("from", e.target.value)}
          className="rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-gray-500">По</label>
        <input
          type="date"
          value={searchParams.get("to") ?? ""}
          onChange={(e) => updateParam("to", e.target.value)}
          className="rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
        >
          Сбросить
        </button>
      )}
    </div>
  );
}
