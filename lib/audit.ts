import { prisma } from "@/lib/prisma";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE";

export async function logAudit(params: {
  actorId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  summary: string;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      summary: params.summary,
    },
  });
}
