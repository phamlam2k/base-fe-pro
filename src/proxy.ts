import { NextResponse, type NextRequest } from "next/server";

import { can } from "@/shared/config/permissions";
import {
  ROUTES,
  isPublicRoute,
  requiredPermissionFor,
} from "@/shared/config/routes";
import { AUTH_COOKIE, decodeSessionToken } from "@/shared/lib/auth/token";

/**
 * Route protection at the network boundary (Next.js 16 renamed `middleware`
 * to `proxy`). Three rules:
 *   1. Unauthenticated users on protected routes → /login?redirect=...
 *   2. Authenticated users on /login → /dashboard
 *   3. Authenticated users lacking the route's permission → /403
 *
 * This is the first line of defense; layouts re-check the session and the
 * API re-checks permissions, so a bypassed proxy never exposes data.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = decodeSessionToken(request.cookies.get(AUTH_COOKIE)?.value);

  if (isPublicRoute(pathname)) {
    if (session) {
      return NextResponse.redirect(new URL(ROUTES.dashboard, request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL(ROUTES.login, request.url);
    if (pathname !== ROUTES.home) {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  const requiredPermission = requiredPermissionFor(pathname);
  if (requiredPermission && !can(session.role, requiredPermission)) {
    return NextResponse.redirect(new URL(ROUTES.forbidden, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Everything except the API (handles its own auth), Next internals and
  // static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
