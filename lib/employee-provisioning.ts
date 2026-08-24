import { prisma } from "@/lib/prisma";

const FALLBACK_DEPARTMENT_NAME = "Без отдела";
const FALLBACK_POSITION_TITLE = "Не указана";

interface DnComponent {
  type: string;
  value: string;
}

// Splits a DN on unescaped commas (AD DNs can contain a literal ",\," inside
// a CN, e.g. "CN=Иванов\, Иван,OU=..."), respecting backslash escapes.
function parseDn(dn: string): DnComponent[] {
  const parts: string[] = [];
  let current = "";
  for (let i = 0; i < dn.length; i++) {
    const char = dn[i];
    if (char === "\\" && i + 1 < dn.length) {
      current += char + dn[i + 1];
      i++;
      continue;
    }
    if (char === ",") {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current) parts.push(current);

  return parts.map((part) => {
    const [type, ...rest] = part.trim().split("=");
    return { type: type.trim().toUpperCase(), value: rest.join("=").trim() };
  });
}

// Department hierarchy comes from every DN component between the person's
// own leaf CN and the domain root (DC=...) - not just OU=, so built-in
// containers like "CN=Users" are picked up too. Order is reversed so the
// topmost container (closest to the domain) comes first.
function getDepartmentPathFromDn(dn: string): string[] {
  return parseDn(dn)
    .slice(1)
    .filter((c) => c.type !== "DC")
    .map((c) => c.value)
    .reverse();
}

async function resolveDepartmentChainId(levels: string[]): Promise<string> {
  let parentId: string | null = null;
  let departmentId = "";
  for (const levelName of levels) {
    const existing = await prisma.department.findFirst({ where: { name: levelName, parentId } });
    departmentId = existing ? existing.id : (await prisma.department.create({ data: { name: levelName, parentId } })).id;
    parentId = departmentId;
  }
  return departmentId;
}

/**
 * Creates an Employee record for a first-time LDAP login that has no
 * matching entry in the org directory, so they immediately show up in the
 * Employees admin list and org structure instead of requiring HR to add
 * them by hand. Department comes from the AD DN's OU chain, position from
 * the AD "title" attribute - both fall back to a generic placeholder when
 * AD doesn't have them, so the record is always valid.
 */
export async function provisionEmployeeFromLdap(params: {
  dn: string;
  email: string;
  displayName: string;
  title?: string;
  phone?: string;
}): Promise<string> {
  const path = getDepartmentPathFromDn(params.dn);
  const departmentId = await resolveDepartmentChainId(path.length > 0 ? path : [FALLBACK_DEPARTMENT_NAME]);

  const titleValue = params.title ?? FALLBACK_POSITION_TITLE;
  const position = await prisma.position.upsert({
    where: { title: titleValue },
    update: {},
    create: { title: titleValue },
  });

  const employee = await prisma.employee.create({
    data: {
      fullName: params.displayName,
      email: params.email,
      phone: params.phone,
      departmentId,
      positionId: position.id,
    },
  });

  return employee.id;
}
