// Entities that have graduated out of the monolith; re-exported here for the
// (not-yet-migrated) rest of the organization domain. `CompanyStatus` is reused
// by Project below.
import { COMPANY_STATUSES } from "@/entities/company";
import type {
  Company,
  CompanyStatus,
  CompanyListParams,
} from "@/entities/company";
import { ORG_ROLES } from "@/entities/company-member";
import type {
  Member,
  OrgRole,
  MemberListParams,
} from "@/entities/company-member";

export { COMPANY_STATUSES, ORG_ROLES };
export type { Company, CompanyStatus, CompanyListParams };
export type { Member, OrgRole, MemberListParams };

/**
 * Organization / RBAC domain types (not-yet-migrated: project, team, ...).
 */

export const TEAM_TYPES = ["SUPERVISION", "CONTRACTOR", "TESTING"] as const;
export type TeamType = (typeof TEAM_TYPES)[number];

export const TEAM_ROLES = ["TEAM_LEAD", "TEAM_MEMBER"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export interface Project {
  id: string;
  companyId: string;
  name: string;
  status: CompanyStatus;
  teamCount: number;
  createdAt: string;
}

export interface Team {
  id: string;
  projectId: string;
  parentTeamId: string | null;
  teamType: TeamType;
  name: string;
  memberCount: number;
  createdAt: string;
}

/** A person inside a team (TVGS / Nhà Thầu / Thí Nghiệm). Invited by email. */
export interface TeamMember {
  id: string;
  teamId: string;
  name: string;
  email: string;
  role: TeamRole;
  createdAt: string;
}

/** An internal company member assigned to a project (chủ đầu tư side). */
export interface ProjectMember {
  id: string;
  projectId: string;
  companyMemberId: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

/** Minimal existing-user info returned by the member picker (id/name/email). */
export interface UserOption {
  id: string;
  name: string;
  email: string;
}
