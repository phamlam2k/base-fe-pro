import { z } from "zod";

import { ORG_ROLES, TEAM_ROLES, TEAM_TYPES } from "@/features/organization/types";

// Company schemas graduated to the company entity; re-export for the rest of
// the (not-yet-migrated) organization domain.
export {
  createCompanyFormSchema,
  companyListQuerySchema,
} from "@/entities/company";
export type { CompanyFormValues } from "@/entities/company";

/**
 * Schema factory pattern (see users/schemas.ts): the client passes a
 * translator scoped to the `organization` namespace; server-side validation
 * calls the factory with no argument and gets the English fallbacks.
 */
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

export function createProjectFormSchema(t?: TFn) {
  const msg = (key: string, fallback: string) => (t ? t(key) : fallback);
  return z.object({
    name: z
      .string()
      .min(2, { message: msg("validation.projectNameMin", "Tên dự án tối thiểu 2 ký tự") }),
  });
}
export type ProjectFormValues = z.infer<ReturnType<typeof createProjectFormSchema>>;

export function createTeamFormSchema(t?: TFn) {
  const msg = (key: string, fallback: string) => (t ? t(key) : fallback);
  return z
    .object({
      name: z
        .string()
        .min(2, { message: msg("validation.teamNameMin", "Tên nhóm tối thiểu 2 ký tự") }),
      teamType: z.enum(TEAM_TYPES, { message: msg("validation.teamTypeRequired", "Chọn loại nhóm") }),
      /** null for a SUPERVISION root; required for CONTRACTOR / TESTING. */
      parentTeamId: z.string().nullable(),
    })
    .refine(
      (v) => (v.teamType === "SUPERVISION" ? v.parentTeamId === null : !!v.parentTeamId),
      {
        path: ["parentTeamId"],
        message: msg(
          "validation.parentRequired",
          "Nhà Thầu / Thí Nghiệm phải thuộc một nhóm TVGS cha",
        ),
      },
    );
}
export type TeamFormValues = z.infer<ReturnType<typeof createTeamFormSchema>>;

export function createTeamMemberFormSchema(t?: TFn) {
  const msg = (key: string, fallback: string) => (t ? t(key) : fallback);
  // The person is picked from existing users (userId handled outside the form).
  return z.object({
    role: z.enum(TEAM_ROLES, { message: msg("validation.roleRequired", "Chọn vai trò") }),
  });
}
export type TeamMemberFormValues = z.infer<
  ReturnType<typeof createTeamMemberFormSchema>
>;

// ---------------------------------------------------------------------------
// Query-string schemas used by the API proxy routes (server-side).
// ---------------------------------------------------------------------------
export const memberListQuerySchema = z.object({
  companyId: z.string().min(1),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  role: z.enum([...ORG_ROLES, "all"]).optional(),
  sortBy: z.enum(["name", "email", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
