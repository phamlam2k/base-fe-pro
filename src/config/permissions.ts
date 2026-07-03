/**
 * RBAC single source of truth.
 *
 * This module is intentionally pure (no React, no server APIs) so it can be
 * imported from anywhere: proxy (middleware), route handlers, server
 * components and client components.
 *
 * To add a permission:
 *  1. Add it to `PERMISSIONS`.
 *  2. Grant it to the relevant roles in `ROLE_PERMISSIONS`.
 *  3. Guard UI with `<PermissionGate>` / `usePermission()`, routes with
 *     `ROUTE_PERMISSIONS` (src/config/routes.ts) and API with `requireAuth`.
 */

export const ROLES = ["admin", "manager", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "dashboard:view",
  "users:view",
  "users:create",
  "users:update",
  "users:delete",
  "products:view",
  "products:create",
  "products:update",
  "products:delete",
  "orders:view",
  "orders:update",
  "settings:view",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: PERMISSIONS,
  manager: [
    "dashboard:view",
    "users:view",
    "users:create",
    "users:update",
    "products:view",
    "products:create",
    "products:update",
    "orders:view",
    "orders:update",
    "settings:view",
  ],
  viewer: ["dashboard:view", "products:view", "orders:view", "settings:view"],
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAny(role: Role, permissions: readonly Permission[]): boolean {
  return permissions.some((permission) => can(role, permission));
}

export function canAll(role: Role, permissions: readonly Permission[]): boolean {
  return permissions.every((permission) => can(role, permission));
}
