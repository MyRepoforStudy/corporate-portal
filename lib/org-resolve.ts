import { prisma } from "@/lib/prisma";

export interface DepartmentCache {
  ids: Map<string, string>;
  created: number;
}

export function createDepartmentCache(): DepartmentCache {
  return { ids: new Map(), created: 0 };
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
  let id: string;
  if (existing) {
    id = existing.id;
  } else {
    const created = await prisma.department.create({ data: { name, parentId } });
    id = created.id;
    cache.created++;
  }
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

export function createPositionCache(): Map<string, string> {
  return new Map();
}

export async function resolvePositionId(title: string, cache: Map<string, string>): Promise<string> {
  const cached = cache.get(title);
  if (cached) return cached;

  const position = await prisma.position.upsert({
    where: { title },
    update: {},
    create: { title },
  });
  cache.set(title, position.id);
  return position.id;
}
