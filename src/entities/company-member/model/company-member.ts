import { z } from "zod";

import type { ListParams } from "@/shared/api/types";

/**
 * Company-member entity model — a person holding a role inside a company
 * (Admin / Delegate / Member). See thiet-ke-phan-quyen-rbac.md.
 */

export const ORG_ROLES = [
  "COMPANY_ADMIN",
  "COMPANY_DELEGATE",
  "COMPANY_MEMBER",
] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export interface Member {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: OrgRole;
  /** Custom job title, mainly for COMPANY_DELEGATE (e.g. "Phó Tổng Giám đốc"). */
  customTitle: string;
  createdAt: string;
}

export interface MemberListParams extends ListParams {
  companyId: string;
  role?: OrgRole | "all";
  sortBy?: "name" | "email" | "createdAt";
}

/** Input for adding a member — the user is picked from existing accounts. */
export interface MemberCreateInput {
  userId: string;
  role: OrgRole;
  customTitle?: string;
}

type TFn = (key: string) => string;

export function createMemberFormSchema(t?: TFn) {
  const msg = (key: string, fallback: string) => (t ? t(key) : fallback);
  // The person is picked from existing users (userId handled outside the form);
  // this schema only covers the editable role + title.
  return z.object({
    role: z.enum(ORG_ROLES, { message: msg("validation.roleRequired", "Chọn vai trò") }),
    customTitle: z.string().max(100).optional(),
  });
}
export type MemberFormValues = z.infer<ReturnType<typeof createMemberFormSchema>>;

/** Query-string schema used by the API proxy route (server-side). */
export const memberListQuerySchema = z.object({
  companyId: z.string().min(1),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  role: z.enum([...ORG_ROLES, "all"]).optional(),
  sortBy: z.enum(["name", "email", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
