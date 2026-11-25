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

/**
 * App roles map onto the platform roles the Django backend returns
 * (see lib/auth/roles.ts):
 *   admin   = SuperAdmin        — platform + user management, everything.
 *   manager = Company Admin/Delegate — the RBAC / access-control console.
 *   viewer  = member            — dashboard + settings only.
 */
export const ROLES = ["admin", "manager", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "dashboard:view",
  "users:view",
  "users:create",
  "users:update",
  "users:delete",
  "orgs:view",
  "orgs:manage",
  // Xem "Quản lý dự án" (trang tách khỏi Phân quyền). Cấp cho mọi vai trò như
  // cổng thô — backend Django scope dữ liệu theo membership (accessible_projects),
  // và nav chỉ hiện cho admin/manager/Chủ đầu tư (canViewProjects).
  "projects:view",
  // Quản lý CÔNG TY (tenant): tạo/sửa/xoá công ty — CHỈ SuperAdmin.
  "companies:manage",
  // Khoanh vùng dự án (bản đồ) — SuperAdmin + Company Admin/Delegate (manager) của
  // công ty sở hữu dự án. Backend scope theo công ty (accessible_projects + CanManageStructure).
  "projects:manage-zone",
  "settings:view",
  "pdf-forms:manage",
  // Nghiệm thu (MAD-8/9/12/13). Gating theo 5 vai trò Madoka sẽ tinh chỉnh ở MAD-4;
  // tạm cấp cho mọi role để dùng được trong lúc phát triển.
  "acceptance:view",
  "acceptance:create",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  // SuperAdmin — người vận hành NỀN TẢNG: CHỈ quản lý công ty + tài khoản Admin
  // của từng công ty (làm trong trang Công ty). KHÔNG thấy màn nghiệp vụ, dự án,
  // dashboard, /users, PDF. `orgs:view` để vào route /organization (= trang Công ty);
  // `settings:view` để đổi mật khẩu/giao diện của chính mình.
  admin: ["companies:manage", "orgs:view", "settings:view"],
  // Company Admin/Delegate — quản trị tài khoản TRONG công ty mình (backend scope
  // theo công ty). Quản lý thành viên qua /users (đã bỏ trang Phân quyền → Thành viên).
  manager: [
    "dashboard:view",
    "users:view",
    "users:create",
    "users:update",
    "users:delete",
    "projects:view",
    // Quản lý cây dự án/nhóm + thành viên nhóm (StructurePanel dùng orgs:manage).
    // Bỏ `orgs:view` → không vào /organization (nay là trang Công ty của SuperAdmin).
    "orgs:manage",
    // Khoanh vùng dự án thuộc công ty mình (backend scope theo công ty).
    "projects:manage-zone",
    "settings:view",
    // Company Admin/Delegate quản biểu mẫu PDF của công ty mình (backend scope theo công ty).
    "pdf-forms:manage",
    "acceptance:view",
    "acceptance:create",
  ],
  // Member — read-only landing surfaces + xem/tạo phiếu nghiệm thu (tạm).
  // projects:view = cổng thô để CĐT (được gán vào dự án) xem "Quản lý dự án";
  // backend scope dữ liệu, nav ẩn với member không phải Chủ đầu tư.
  viewer: [
    "dashboard:view",
    "projects:view",
    "settings:view",
    "acceptance:view",
    "acceptance:create",
  ],
};

/**
 * Ai được THẤY mục "Quản lý dự án" (nav) + vào trang: quản trị công ty
 * (admin/manager) HOẶC Chủ đầu tư theo vai trò Madoka (investor). Dữ liệu thực
 * tế vẫn do backend scope theo dự án được gán.
 */
export function canViewProjects(
  role: Role,
  madokaRole: string | undefined,
): boolean {
  return role === "manager" || madokaRole === "investor";
}

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAny(role: Role, permissions: readonly Permission[]): boolean {
  return permissions.some((permission) => can(role, permission));
}

export function canAll(role: Role, permissions: readonly Permission[]): boolean {
  return permissions.every((permission) => can(role, permission));
}
