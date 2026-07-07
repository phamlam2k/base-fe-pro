/**
 * Public API of the `organization` feature (Access Management / RBAC console).
 *
 * External code (app/, other features) imports ONLY from here — ESLint blocks
 * deep imports. Internal components/columns stay private implementation details.
 */
export { OrganizationView } from "./views/organization-view";
export { RoleLegend } from "./views/role-legend";

export {
  useCompanies,
  useMembers,
  useProjects,
  useTeams,
  useCreateCompany,
  useUpdateCompany,
  useCreateMember,
  useUpdateMember,
  useDeleteMember,
  useCreateProject,
  useCreateTeam,
} from "./hooks";

export { organizationApi, organizationKeys } from "./api";

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
