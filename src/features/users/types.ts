import type { Role } from "@/config/permissions";
import type { ListParams } from "@/types/api";

export const USER_STATUSES = ["active", "invited", "suspended"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

/** The User entity as returned by the API. */
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
}

export interface UserListParams extends ListParams {
  role?: Role | "all";
  status?: UserStatus | "all";
  sortBy?: "name" | "email" | "createdAt";
}
