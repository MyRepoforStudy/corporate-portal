import { Download, History } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui/empty-state";
import { AuditLogFilters } from "@/components/admin/audit-log-filters";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return date.toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Создание",
  UPDATE: "Изменение",
  DELETE: "Удаление",
};

const ACTION_BADGE_CLASSES: Record<string, string> = {
  CREATE: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  UPDATE: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  DELETE: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: { action?: string; entityType?: string; actorId?: string; from?: string; to?: string };
}) {
  const { action, entityType, actorId, from, to } = searchParams;

  const where: Prisma.AuditLogWhereInput = {
    action: action || undefined,
    entityType: entityType || undefined,
    actorId: actorId || undefined,
    createdAt:
      from || to
        ? {
            gte: from ? new Date(`${from}T00:00:00`) : undefined,
            lte: to ? new Date(`${to}T23:59:59`) : undefined,
          }
        : undefined,
  };

  const [entries, entityTypeRows, actorRows] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { actor: { select: { displayName: true, email: true } } },
    }),
    prisma.auditLog.findMany({ distinct: ["entityType"], select: { entityType: true }, orderBy: { entityType: "asc" } }),
    prisma.auditLog.findMany({
      distinct: ["actorId"],
      select: { actor: { select: { id: true, displayName: true } } },
    }),
  ]);

  const entityTypes = entityTypeRows.map((r) => r.entityType);
  const actors = actorRows
    .map((r) => r.actor)
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "ru"));

  const exportParams = new URLSearchParams();
  if (action) exportParams.set("action", action);
  if (entityType) exportParams.set("entityType", entityType);
  if (actorId) exportParams.set("actorId", actorId);
  if (from) exportParams.set("from", from);
  if (to) exportParams.set("to", to);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Журнал действий</h1>
          <p className="text-sm text-gray-500">Последние 200 изменений в админ-панели</p>
        </div>
        <a
          href={`/api/admin/audit-log/export?${exportParams.toString()}`}
          className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Экспорт в CSV
        </a>
      </div>

      <AuditLogFilters entityTypes={entityTypes} actors={actors} />

      {entries.length === 0 ? (
        <EmptyState icon={History} text="Записей пока нет." />
      ) : (
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
              <div>
                <p className="flex flex-wrap items-center gap-2 text-sm text-gray-900">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      ACTION_BADGE_CLASSES[entry.action] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {ACTION_LABELS[entry.action] ?? entry.action}
                  </span>
                  {entry.summary}
                </p>
                <p className="text-xs text-gray-500">{entry.actor.displayName}</p>
              </div>
              <span className="shrink-0 text-xs text-gray-500">{formatDate(entry.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
