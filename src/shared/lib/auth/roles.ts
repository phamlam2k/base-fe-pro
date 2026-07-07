import type { Role } from "@/shared/config/permissions";

/**
 * Django exposes a coarse `platform_role` on `/auth/me/`:
 *   super_admin | company_admin | member
 *
 * The web console's routing/UI gating uses the app's own role vocabulary
 * (admin/manager/viewer). This is the single mapping between the two:
 *   super_admin  → admin   (SuperAdmin: platform + user management)
 *   company_admin→ manager (Company Admin/Delegate: RBAC console)
 *   member       → viewer  (everyone else: minimal)
 */
export function platformRoleToAppRole(platformRole: string | undefined): Role {
  switch (platformRole) {
    case "super_admin":
      return "admin";
    case "company_admin":
      return "manager";
    default:
      return "viewer";
  }
}
