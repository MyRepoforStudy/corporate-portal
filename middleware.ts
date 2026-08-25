import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_API_PATHS = ["/api/auth", "/api/health", "/api/ready"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_API_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isApiRoute = pathname.startsWith("/api");

  if (!token) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // HR's admin access is limited to the overview, news, departments,
  // positions, employees, rooms, and import; roles/audit-log/resource-links/
  // bookings stay Admin-only since they're the sensitive rows in the
  // permission matrix. This is UI/route gating for convenience - the real
  // defense is requireAdmin()/requireHrOrAdmin() inside each API handler,
  // which stays authoritative.
  const ADMIN_ONLY_SEGMENTS = ["users", "audit-log", "resource-links", "bookings", "team-spotlights"];
  const isAdminArea = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isAdminOnlyArea = ADMIN_ONLY_SEGMENTS.some(
    (segment) => pathname.startsWith(`/admin/${segment}`) || pathname.startsWith(`/api/admin/${segment}`)
  );

  if (isAdminOnlyArea && token.role !== "ADMIN") {
    if (isApiRoute) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isAdminArea && !isAdminOnlyArea && token.role !== "ADMIN" && token.role !== "HR") {
    if (isApiRoute) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Explicit allowlist of routes that actually need auth, instead of trying
  // to exclude every static-asset pattern from a catch-all matcher. Anything
  // not listed here (public/logo.svg, public/uploads/*, _next/*, etc.) is
  // simply never seen by this middleware and Next.js serves it normally -
  // far more robust than maintaining a growing exclusion regex.
  matcher: [
    "/",
    "/org-structure/:path*",
    "/bookings/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/api/:path*",
  ],
};
