/** Public API of the `team` entity (FSD). */
export { teamApi } from "./api/team.api";
export { teamQueries } from "./api/team.queries";
export { TeamTypeBadge } from "./ui/team-type-badge";
export { TEAM_TYPES, createTeamFormSchema } from "./model/team";
export type { Team, TeamType, TeamFormValues } from "./model/team";
