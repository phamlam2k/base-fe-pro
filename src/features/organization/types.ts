/**
 * Organization domain — compatibility bridge.
 *
 * Every concept has graduated to its own FSD entity. This module re-exports
 * them so the not-yet-migrated organization UI + proxy routes keep compiling
 * (feature → entity is a valid downward FSD import). It disappears once P3–P5
 * repoint the remaining consumers directly at the entities.
 */
export { COMPANY_STATUSES } from "@/entities/company";
export type { Company, CompanyStatus, CompanyListParams } from "@/entities/company";
export { ORG_ROLES } from "@/entities/company-member";
export type { Member, OrgRole, MemberListParams } from "@/entities/company-member";
export type { Project, ProjectStatus } from "@/entities/project";
export { TEAM_TYPES } from "@/entities/team";
export type { Team, TeamType } from "@/entities/team";
export { TEAM_ROLES } from "@/entities/team-member";
export type { TeamMember, TeamRole } from "@/entities/team-member";
export type { ProjectMember } from "@/entities/project-member";
export type { UserOption } from "@/entities/user";
