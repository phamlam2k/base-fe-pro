import { z } from "zod";

/**
 * Team entity — TVGS (Supervision) / Nhà Thầu (Contractor) / Thí Nghiệm
 * (Testing), forming a tree via `parentTeamId`. See thiet-ke-phan-quyen-rbac.md.
 */
export const TEAM_TYPES = ["SUPERVISION", "CONTRACTOR", "TESTING"] as const;
export type TeamType = (typeof TEAM_TYPES)[number];

export interface Team {
  id: string;
  projectId: string;
  parentTeamId: string | null;
  teamType: TeamType;
  name: string;
  memberCount: number;
  createdAt: string;
}

type TFn = (key: string) => string;

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
