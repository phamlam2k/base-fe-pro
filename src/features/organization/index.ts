/**
 * `organization` — compatibility bridge (shrinking).
 *
 * The console UI graduated to `widgets/org-console`; the domain concepts to
 * their entities. This module now only re-exports the org contract (status /
 * role constants + list-param types) that the `app/api/organization/**` proxy
 * route handlers still import. It disappears in P5 when those handlers point
 * straight at the entities.
 */
export {
  COMPANY_STATUSES,
  ORG_ROLES,
  TEAM_TYPES,
  TEAM_ROLES,
} from "./types";
export type {
  Company,
  CompanyStatus,
  Member,
  OrgRole,
  Project,
  Team,
  TeamType,
  TeamRole,
  CompanyListParams,
  MemberListParams,
} from "./types";
