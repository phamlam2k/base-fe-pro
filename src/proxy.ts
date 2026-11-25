import { NextResponse, type NextRequest } from "next/server";

import { can, canViewProjects } from "@/shared/config/permissions";
import {
  ROUTES,
  defaultLandingFor,
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
      return NextResponse.redirect(
        new URL(defaultLandingFor(session.role), request.url),
      );
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

  // MAD-36: tài khoản phải đổi mật khẩu (lần đầu / sau khi Admin reset) bị chặn
  // ở mọi trang cho tới khi đổi xong. Chỉ cho ở đúng trang /change-password.
  const onChangePassword = pathname === ROUTES.changePassword;
  if (session.mustChangePassword && !onChangePassword) {
    return NextResponse.redirect(new URL(ROUTES.changePassword, request.url));
  }
  // Đã đổi xong (hoặc không cần) mà vẫn ở /change-password → đưa về trang mặc định.
  if (!session.mustChangePassword && onChangePassword) {
    return NextResponse.redirect(
      new URL(defaultLandingFor(session.role), request.url),
    );
  }

  // "Quản lý dự án": chỉ quản trị công ty (admin/manager) hoặc Chủ đầu tư
  // (madokaRole investor). Cần madokaRole nên không dùng ROUTE_PERMISSIONS thuần.
  if (pathname.startsWith(ROUTES.projectManagement)) {
    if (!canViewProjects(session.role, session.madokaRole)) {
      return NextResponse.redirect(new URL(ROUTES.forbidden, request.url));
    }
    return NextResponse.next();
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
