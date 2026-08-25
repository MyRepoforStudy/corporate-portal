import { Client, type Entry } from "ldapts";

export interface LdapUser {
  ldapUid: string;
  email: string;
  displayName: string;
}

/**
 * Escapes a value for safe interpolation into an LDAP search filter (RFC 4515),
 * so a login value can never be used to inject extra filter clauses.
 */
function escapeLdapFilterValue(value: string): string {
  return value.replace(/[\\*()\0/]/g, (char) => {
    switch (char) {
      case "\\":
        return "\\5c";
      case "*":
        return "\\2a";
      case "(":
        return "\\28";
      case ")":
        return "\\29";
      case "\0":
        return "\\00";
      case "/":
        return "\\2f";
      default:
        return char;
    }
  });
}

export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function createClient(): Client {
  const url = getRequiredEnv("LDAP_URL");
  // ldapts wraps the connection in TLS if tlsOptions is present at all,
  // regardless of URL scheme - only pass it for ldaps:// or the client will
  // try to TLS-handshake a plaintext ldap:// port and get ECONNRESET.
  const isSecure = url.startsWith("ldaps://");
  return new Client({
    url,
    ...(isSecure ? { tlsOptions: { rejectUnauthorized: true } } : {}),
    timeout: 10_000,
    connectTimeout: 10_000,
  });
}

export function attr(entry: Entry, name: string): string | undefined {
  const value = entry[name];
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first : first?.toString();
  }
  if (Buffer.isBuffer(value)) return value.toString();
  return undefined;
}

/**
 * Authenticates a user against Active Directory via LDAP:
 * 1. binds with the service account to locate the user's DN,
 * 2. re-binds as that DN with the supplied password to verify credentials.
 */
export async function authenticateWithLdap(
  username: string,
  password: string
): Promise<LdapUser | null> {
  if (!username || !password) return null;

  const bindDn = getRequiredEnv("LDAP_BIND_DN");
  const bindPassword = getRequiredEnv("LDAP_BIND_PASSWORD");
  const baseDn = getRequiredEnv("LDAP_BASE_DN");
  const searchFilterTemplate = getRequiredEnv("LDAP_SEARCH_FILTER");

  const filter = searchFilterTemplate.replace(
    /%s/g,
    escapeLdapFilterValue(username)
  );

  const searchClient = createClient();
  let entry: Entry | undefined;
  try {
    try {
      await searchClient.bind(bindDn, bindPassword);
    } catch (err) {
      console.error(
        `[ldap] service account bind failed for LDAP_BIND_DN="${bindDn}" against ${process.env.LDAP_URL}:`,
        err
      );
      throw err;
    }

    const { searchEntries, searchReferences } = await searchClient.search(baseDn, {
      scope: "sub",
      filter,
      attributes: ["dn", "mail", "displayName", "cn", "sAMAccountName"],
      paged: true,
    });
    console.log(
      `[ldap] search returned ${searchEntries.length} entr${searchEntries.length === 1 ? "y" : "ies"}, ${searchReferences.length} reference(s)`
    );

    entry = searchEntries[0];
  } finally {
    await searchClient.unbind().catch(() => {});
  }

  if (!entry) {
    console.warn(
      `[ldap] no entry found for filter="${filter}" under baseDn="${baseDn}" (login="${username}")`
    );
    return null;
  }

  const userDn = entry.dn;
  const verifyClient = createClient();
  try {
    await verifyClient.bind(userDn, password);
  } catch (err) {
    console.warn(`[ldap] password bind failed for dn="${userDn}":`, (err as Error)?.message ?? err);
    return null;
  } finally {
    await verifyClient.unbind().catch(() => {});
  }

  const ldapUid = attr(entry, "sAMAccountName") ?? username;
  const email = attr(entry, "mail") ?? `${ldapUid}@bank.local`;
  const displayName = attr(entry, "displayName") ?? attr(entry, "cn") ?? ldapUid;

  return { ldapUid, email, displayName };
}

/**
 * Local-development stand-in so the app can be run without a real domain
 * controller. Accepts any non-empty username/password pair. Only ever
 * reachable when AUTH_DEV_MODE=true AND NODE_ENV !== "production" (enforced
 * by the caller in lib/auth.ts) - never wired into a production build path.
 */
export async function authenticateWithDevMock(
  username: string,
  password: string
): Promise<LdapUser | null> {
  if (!username || !password) return null;

  return {
    ldapUid: username,
    email: `${username}@bank.local`,
    displayName: username,
  };
}
