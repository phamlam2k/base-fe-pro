import type { ListParams } from "@/shared/api/types";

/**
 * Organization / RBAC domain types.
 *
 * Mirrors the backend design in `thiet-ke-phan-quyen-rbac.md`:
 * Platform (SuperAdmin) → Company (Admin / Delegate / Member) →
 * Project (Member) → Team tree (TVGS / Nhà Thầu / Thí Nghiệm).
 *
 * These are the ROLES-as-data managed by the console. They are separate from
 * the app's own auth roles (admin / manager / viewer) that gate the page.
 */

export const COMPANY_STATUSES = ["ACTIVE", "SUSPENDED"] as const;
export type CompanyStatus = (typeof COMPANY_STATUSES)[number];

/** Roles a person can hold inside a company. SuperAdmin is platform-level. */
export const ORG_ROLES = [
  "COMPANY_ADMIN",
  "COMPANY_DELEGATE",
  "COMPANY_MEMBER",
] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export const TEAM_TYPES = ["SUPERVISION", "CONTRACTOR", "TESTING"] as const;
export type TeamType = (typeof TEAM_TYPES)[number];

export const TEAM_ROLES = ["TEAM_LEAD", "TEAM_MEMBER"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export interface Company {
  id: string;
  name: string;
  status: CompanyStatus;
  memberCount: number;
  projectCount: number;
  createdAt: string;
}

export interface Member {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: OrgRole;
  /** Custom job title, mainly for COMPANY_DELEGATE (e.g. "Phó Tổng Giám đốc"). */
  customTitle: string;
  createdAt: string;
}

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

export interface CompanyListParams extends ListParams {
  status?: CompanyStatus | "all";
  sortBy?: "name" | "createdAt";
}

export interface MemberListParams extends ListParams {
  companyId: string;
  role?: OrgRole | "all";
  sortBy?: "name" | "email" | "createdAt";
}
