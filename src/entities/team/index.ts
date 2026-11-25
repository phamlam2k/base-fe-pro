/** Public API of the `team` entity (FSD). */
export { teamApi } from "./api/team.api";
export { teamQueries } from "./api/team.queries";
export { TeamTypeBadge } from "./ui/team-type-badge";
export {
  TEAM_TYPES,
  createTeamFormSchema,
  placementKey,
  parsePlacementKey,
  placementOptions,
  placementsPayload,
  teamFromBackend,
} from "./model/team";
export type { RawTeam, Team, TeamPlacement, TeamType, TeamFormValues } from "./model/team";
