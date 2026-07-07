import type { Permission } from "@/shared/config/permissions";

/**
 * Centralized route paths. Never hardcode a path string in a component —
 * import from here so renames stay one-line changes.
 */
export const ROUTES = {
  home: "/",
  login: "/login",
  forbidden: "/403",
  dashboard: "/dashboard",
  users: "/users",
  organization: "/organization",
  formExample: "/examples/form",
  wizardExample: "/examples/wizard",
  settingsAppearance: "/settings/appearance",
  settingsProfile: "/settings/profile",
} as const;

/** Routes reachable without a session. */
export const PUBLIC_ROUTES: readonly string[] = [ROUTES.login];

/**
 * Route-level permission requirements, enforced in `src/proxy.ts`.
 * Matching is prefix-based: "/users" also covers "/users/123".
 */
export const ROUTE_PERMISSIONS: ReadonlyArray<{
  prefix: string;
  permission: Permission;
}> = [
  { prefix: ROUTES.users, permission: "users:view" },
  { prefix: ROUTES.organization, permission: "orgs:view" },
  { prefix: ROUTES.dashboard, permission: "dashboard:view" },
];

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function requiredPermissionFor(pathname: string): Permission | null {
  const match = ROUTE_PERMISSIONS.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return match?.permission ?? null;
}
