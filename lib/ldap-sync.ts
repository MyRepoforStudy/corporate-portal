import { prisma } from "@/lib/prisma";
import { attr, createClient, getRequiredEnv } from "@/lib/ldap";

const FALLBACK_DEPARTMENT_NAME = "Без отдела";
const FALLBACK_POSITION_TITLE = "Не указана";

// Excludes disabled accounts (userAccountControl bit 2 = ACCOUNTDISABLE) so
// departed employees whose AD account was disabled - but not yet deleted -
// don't keep getting re-synced. Overridable per-environment since AD schemas
// and conventions vary bank to bank.
const DEFAULT_SYNC_FILTER =
  "(&(objectCategory=person)(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))";

export interface OrgSyncResult {
  departmentsCreated: number;
  employeesCreated: number;
  employeesUpdated: number;
  skipped: { dn: string; reason: string }[];
}

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
// containers like "CN=Users" are picked up too instead of being dropped.
// Order is reversed so the topmost container (closest to the domain) comes
// first, matching how Department.parentId chains are built below.
function getDepartmentPathFromDn(dn: string): string[] {
  const components = parseDn(dn);
  return components
    .slice(1)
    .filter((c) => c.type !== "DC")
    .map((c) => c.value)
    .reverse();
}

async function resolveDepartmentId(
  name: string,
  parentId: string | null,
  cache: Map<string, string>,
  result: OrgSyncResult
): Promise<string> {
  const key = `${parentId ?? "root"}::${name}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const existing = await prisma.department.findFirst({ where: { name, parentId } });
  let id: string;
  if (existing) {
    id = existing.id;
  } else {
    const created = await prisma.department.create({ data: { name, parentId } });
    id = created.id;
    result.departmentsCreated++;
  }
  cache.set(key, id);
  return id;
}

export async function syncOrgStructureFromLdap(): Promise<OrgSyncResult> {
  const bindDn = getRequiredEnv("LDAP_BIND_DN");
  const bindPassword = getRequiredEnv("LDAP_BIND_PASSWORD");
  // Separate from LDAP_BASE_DN (used for login lookups) so the org-structure
  // sync can be scoped to a narrower OU without touching how sign-in works -
  // falls back to LDAP_BASE_DN if not set.
  const baseDn = process.env.LDAP_SYNC_BASE_DN || getRequiredEnv("LDAP_BASE_DN");
  const filter = process.env.LDAP_SYNC_FILTER ?? DEFAULT_SYNC_FILTER;

  const result: OrgSyncResult = {
    departmentsCreated: 0,
    employeesCreated: 0,
    employeesUpdated: 0,
    skipped: [],
  };

  const departmentCache = new Map<string, string>();
  const positionCache = new Map<string, string>();

  const client = createClient();
  try {
    try {
      await client.bind(bindDn, bindPassword);
    } catch (err) {
      console.error(`[ldap-sync] service account bind failed for LDAP_BIND_DN="${bindDn}":`, err);
      throw err;
    }

    const { searchEntries } = await client.search(baseDn, {
      scope: "sub",
      filter,
      attributes: ["mail", "displayName", "title", "telephoneNumber"],
      paged: true,
    });
    console.log(`[ldap-sync] directory search returned ${searchEntries.length} entr${searchEntries.length === 1 ? "y" : "ies"}`);

    for (const entry of searchEntries) {
      const dn = typeof entry.dn === "string" ? entry.dn : String(entry.dn);
      const email = attr(entry, "mail");
      const displayName = attr(entry, "displayName");

      if (!email || !displayName) {
        result.skipped.push({ dn, reason: "Нет email или отображаемого имени в AD" });
        continue;
      }

      const path = getDepartmentPathFromDn(dn);
      const levels = path.length > 0 ? path : [FALLBACK_DEPARTMENT_NAME];

      let parentId: string | null = null;
      let departmentId = "";
      for (const levelName of levels) {
        departmentId = await resolveDepartmentId(levelName, parentId, departmentCache, result);
        parentId = departmentId;
      }

      const titleValue = attr(entry, "title") ?? FALLBACK_POSITION_TITLE;
      let positionId = positionCache.get(titleValue);
      if (!positionId) {
        const position = await prisma.position.upsert({
          where: { title: titleValue },
          update: {},
          create: { title: titleValue },
        });
        positionId = position.id;
        positionCache.set(titleValue, positionId);
      }

      const phone = attr(entry, "telephoneNumber");
      const existingEmployee = await prisma.employee.findUnique({ where: { email } });

      await prisma.employee.upsert({
        where: { email },
        update: {
          fullName: displayName,
          ...(phone ? { phone } : {}),
          departmentId,
          positionId,
        },
        create: {
          fullName: displayName,
          email,
          phone,
          departmentId,
          positionId,
        },
      });

      if (existingEmployee) {
        result.employeesUpdated++;
      } else {
        result.employeesCreated++;
      }
    }
  } finally {
    await client.unbind().catch(() => {});
  }

  return result;
}
