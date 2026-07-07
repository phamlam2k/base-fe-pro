import { z } from "zod";

import { TEAM_ROLES, TEAM_TYPES } from "@/features/organization/types";

// Company + company-member schemas graduated to their entities; re-export for
// the (not-yet-migrated) rest of the organization domain.
export {
  createCompanyFormSchema,
  companyListQuerySchema,
} from "@/entities/company";
export type { CompanyFormValues } from "@/entities/company";
export {
  createMemberFormSchema,
  memberListQuerySchema,
} from "@/entities/company-member";
export type { MemberFormValues } from "@/entities/company-member";

/**
 * Schema factory pattern (see users/schemas.ts): the client passes a
 * translator scoped to the `organization` namespace; server-side validation
 * calls the factory with no argument and gets the English fallbacks.
 */
type TFn = (key: string) => string;

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
