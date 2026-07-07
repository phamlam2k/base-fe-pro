import { z } from "zod";

import type { ListParams } from "@/shared/api/types";

/**
 * Company entity model — types + validation schemas (FSD `model` segment).
 * A company (chủ đầu tư) is the RBAC tenant; see thiet-ke-phan-quyen-rbac.md.
 */

export const COMPANY_STATUSES = ["ACTIVE", "SUSPENDED"] as const;
export type CompanyStatus = (typeof COMPANY_STATUSES)[number];

export interface Company {
  id: string;
  name: string;
  status: CompanyStatus;
  memberCount: number;
  projectCount: number;
  createdAt: string;
}

export interface CompanyListParams extends ListParams {
  status?: CompanyStatus | "all";
  sortBy?: "name" | "createdAt";
}

type TFn = (key: string) => string;

export function createCompanyFormSchema(t?: TFn) {
  const msg = (key: string, fallback: string) => (t ? t(key) : fallback);
  return z.object({
    name: z
      .string()
      .min(2, { message: msg("validation.companyNameMin", "Tên công ty tối thiểu 2 ký tự") }),
    status: z.enum(COMPANY_STATUSES),
  });
}
export type CompanyFormValues = z.infer<ReturnType<typeof createCompanyFormSchema>>;

/** Query-string schema used by the API proxy route (server-side). */
export const companyListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum([...COMPANY_STATUSES, "all"]).optional(),
  sortBy: z.enum(["name", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
