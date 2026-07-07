import type { ListParams } from "@/shared/api/types";
// Company graduated to its own entity; re-export for the (not-yet-migrated)
// rest of the organization domain. `CompanyStatus` is reused by Project below.
import { COMPANY_STATUSES } from "@/entities/company";
import type {
  Company,
  CompanyStatus,
  CompanyListParams,
} from "@/entities/company";

export { COMPANY_STATUSES };
export type { Company, CompanyStatus, CompanyListParams };

/**
 * Organization / RBAC domain types.
 *
 * Mirrors the backend design in `thiet-ke-phan-quyen-rbac.md`:
 * Platform (SuperAdmin) → Company (Admin / Delegate / Member) →
 * Project (Member) → Team tree (TVGS / Nhà Thầu / Thí Nghiệm).
 */

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

export interface MemberListParams extends ListParams {
  companyId: string;
  role?: OrgRole | "all";
  sortBy?: "name" | "email" | "createdAt";
}
