import { z } from "zod";

/** Team-member entity — a person inside a team (TVGS / Nhà Thầu / Thí Nghiệm). */
export const TEAM_ROLES = ["TEAM_LEAD", "TEAM_MEMBER"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export interface TeamMember {
  id: string;
  teamId: string;
  name: string;
  email: string;
  role: TeamRole;
  createdAt: string;
}

/** Input for adding a team member — the user is picked from existing accounts. */
export interface TeamMemberCreateInput {
  userId: string;
  role: TeamRole;
}

type TFn = (key: string) => string;

export function createTeamMemberFormSchema(t?: TFn) {
  const msg = (key: string, fallback: string) => (t ? t(key) : fallback);
  return z.object({
    role: z.enum(TEAM_ROLES, { message: msg("validation.roleRequired", "Chọn vai trò") }),
  });
}
export type TeamMemberFormValues = z.infer<
  ReturnType<typeof createTeamMemberFormSchema>
>;
