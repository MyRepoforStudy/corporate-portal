import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/rbac";
import { toCsv } from "@/lib/csv";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || undefined;
    const entityType = searchParams.get("entityType") || undefined;
    const actorId = searchParams.get("actorId") || undefined;
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;

    const where: Prisma.AuditLogWhereInput = {
      action,
      entityType,
      actorId,
      createdAt:
        from || to
          ? {
              gte: from ? new Date(`${from}T00:00:00`) : undefined,
              lte: to ? new Date(`${to}T23:59:59`) : undefined,
            }
          : undefined,
    };

    const entries = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { displayName: true, email: true } } },
    });

    const csv = toCsv([
      ["createdAt", "action", "entityType", "entityId", "actor", "summary"],
      ...entries.map((e) => [
        e.createdAt.toISOString(),
        e.action,
        e.entityType,
        e.entityId ?? "",
        e.actor.displayName,
        e.summary,
      ]),
    ]);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="audit-log.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
