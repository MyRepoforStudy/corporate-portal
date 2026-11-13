import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/rbac";
import type { AboutImportPlan } from "@/lib/about";

/** Key of a chapter/section created in the admin UI (rows from a JSON file bring their own readable keys). */
export function newAboutKey(): string {
  return `s-${randomBytes(4).toString("hex")}`;
}

/** A section can only live in a chapter (two levels): the parent must exist and be a chapter itself. */
export async function assertChapter(parentId: string): Promise<void> {
  const parent = await prisma.aboutSection.findUnique({
    where: { id: parentId },
    select: { parentId: true },
  });
  if (!parent) throw new ApiError(400, "Глава не найдена");
  if (parent.parentId !== null) throw new ApiError(400, "Раздел можно вложить только в главу, а не в другой раздел");
}

/** The next free position at the end of a list of siblings. */
export async function nextAboutOrder(parentId: string | null): Promise<number> {
  const last = await prisma.aboutSection.aggregate({ where: { parentId }, _max: { order: true } });
  return (last._max.order ?? -1) + 1;
}

/** Swap a chapter/section with its neighbour; positions are renumbered 0..n-1 so equal values never cause trouble. */
export async function moveAboutRow(id: string, direction: "up" | "down"): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const row = await tx.aboutSection.findUniqueOrThrow({ where: { id }, select: { parentId: true } });
    const siblings = await tx.aboutSection.findMany({
      where: { parentId: row.parentId },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    });
    const ids = siblings.map((s) => s.id);
    const index = ids.indexOf(id);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    for (let i = 0; i < ids.length; i++) {
      await tx.aboutSection.update({ where: { id: ids[i] }, data: { order: i } });
    }
  });
}

export interface AboutImportOutcome {
  created: number;
  updated: number;
  unchanged: number;
  errors: { where: string; message: string }[];
}

/** Applies a plan from planAboutImport in one transaction: chapters first, because a section needs its chapter's id. */
export async function saveAboutImport(plan: AboutImportPlan): Promise<AboutImportOutcome> {
  let created = 0;
  let updated = 0;

  await prisma.$transaction(
    async (tx) => {
      const rows = await tx.aboutSection.findMany({ select: { id: true, key: true } });
      const ids = new Map(rows.map((row) => [row.key, row.id]));

      for (const kind of ["chapter", "section"] as const) {
        for (const op of plan.ops.filter((o) => o.kind === kind)) {
          if (op.op === "update") {
            await tx.aboutSection.update({ where: { key: op.key }, data: op.data });
            updated += 1;
            continue;
          }
          const parentId = op.parentKey ? ids.get(op.parentKey) : null;
          if (op.parentKey && !parentId) throw new Error(`Глава «${op.parentKey}» не найдена`);
          const row = await tx.aboutSection.create({
            data: {
              key: op.key,
              parentId: parentId ?? null,
              order: op.order,
              isPublished: op.data.isPublished ?? true,
              titleRu: op.data.titleRu ?? op.key,
              titleKk: op.data.titleKk ?? "",
              titleKo: op.data.titleKo ?? "",
              bodyRu: op.data.bodyRu ?? "",
              bodyKk: op.data.bodyKk ?? "",
              bodyKo: op.data.bodyKo ?? "",
            },
          });
          ids.set(op.key, row.id);
          created += 1;
        }
      }
    },
    { timeout: 60_000 }
  );

  return { created, updated, unchanged: plan.unchanged, errors: plan.errors };
}
