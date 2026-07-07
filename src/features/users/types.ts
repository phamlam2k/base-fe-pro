import type { ListParams } from "@/shared/api/types";

/**
 * Platform user (managed by SuperAdmin), backed by the Django `accounts.User`
 * model — see thiet-ke-phan-quyen-rbac.md §3. `isSuperAdmin` maps to Django's
 * `is_superuser`.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  isSuperAdmin: boolean;
  isActive: boolean;
  createdAt: string;
}

export const SUPER_ADMIN_FILTERS = ["all", "yes", "no"] as const;
export type SuperAdminFilter = (typeof SUPER_ADMIN_FILTERS)[number];

export interface UserListParams extends ListParams {
  superAdmin?: SuperAdminFilter;
  sortBy?: "name" | "email" | "createdAt";
}
