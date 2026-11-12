import { prisma } from "@/lib/prisma";

// Shared "find or create" helpers for the department tree and positions, used
// by the employee CSV import. The caches live for one import run, so a file
// with thousands of rows does one lookup per distinct department/position.

export interface DepartmentCache {
  ids: Map<string, string>;
  created: number;
}

export function createDepartmentCache(): DepartmentCache {
  return { ids: new Map(), created: 0 };
}

/** One past the highest `order` among the siblings under `parentId`. */
async function nextSiblingOrder(parentId: string | null): Promise<number> {
  const { _max } = await prisma.department.aggregate({ where: { parentId }, _max: { order: true } });
  return (_max.order ?? -1) + 1;
}

async function createDepartment(
  name: string,
  parentId: string | null,
  cache: DepartmentCache
): Promise<string> {
  // New departments go after their siblings, so a fresh import keeps the order
  // of the source file (the org chart sorts by `order`, then alphabetically).
  const created = await prisma.department.create({
    data: { name, parentId, order: await nextSiblingOrder(parentId) },
  });
  cache.created++;
  return created.id;
}

async function resolveDepartmentId(
  name: string,
  parentId: string | null,
  cache: DepartmentCache
): Promise<string> {
  const key = `${parentId ?? "root"}::${name}`;
  const cached = cache.ids.get(key);
  if (cached) return cached;

  const existing = await prisma.department.findFirst({ where: { name, parentId } });
  const id = existing ? existing.id : await createDepartment(name, parentId, cache);
  cache.ids.set(key, id);
  return id;
}

/** Resolves (creating as needed) a chain of nested departments, returning the leaf's id. */
export async function resolveDepartmentPath(
  pathSegments: string[],
  cache: DepartmentCache
): Promise<string> {
  let parentId: string | null = null;
  let departmentId = "";

  for (const name of pathSegments) {
    departmentId = await resolveDepartmentId(name, parentId, cache);
    parentId = departmentId;
  }

  return departmentId;
}

/**
 * Flat-mode lookup for CSVs with a single `department` column: any department
 * with this name, wherever it sits in the tree; created at the top level if
 * there is none.
 */
export async function resolveDepartmentByName(name: string, cache: DepartmentCache): Promise<string> {
  const key = `flat::${name}`;
  const cached = cache.ids.get(key);
  if (cached) return cached;

  const existing = await prisma.department.findFirst({ where: { name } });
  const id = existing ? existing.id : await createDepartment(name, null, cache);
  cache.ids.set(key, id);
  return id;
}

export interface PositionCache {
  ids: Map<string, string>;
  created: number;
}

export function createPositionCache(): PositionCache {
  return { ids: new Map(), created: 0 };
}

/**
 * Finds or creates a position by exact title. When `rank` is given it is
 * applied to a new position and also to an existing one whose rank differs -
 * the import file is the source of truth for seniority.
 */
export async function resolvePositionId(
  title: string,
  cache: PositionCache,
  rank?: number
): Promise<string> {
  const cached = cache.ids.get(title);
  if (cached) return cached;

  const existing = await prisma.position.findUnique({ where: { title } });
  let id: string;
  if (existing) {
    id = existing.id;
    if (rank !== undefined && existing.rank !== rank) {
      await prisma.position.update({ where: { id }, data: { rank } });
    }
  } else {
    const created = await prisma.position.create({ data: { title, rank: rank ?? 0 } });
    id = created.id;
    cache.created++;
  }
  cache.ids.set(title, id);
  return id;
}
