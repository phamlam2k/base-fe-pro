import "server-only";

import type { Role } from "@/shared/config/permissions";

/**
 * In-memory mock database backing the /api route handlers.
 *
 * - Seeded deterministically so every developer sees the same data.
 * - Stored on `globalThis` so it survives HMR recompiles in dev.
 * - Mutations (create/update/delete) persist until the server restarts.
 *
 * Replace the route handlers in `src/app/api` with a real backend when
 * ready — the feature layer only talks to the HTTP contract.
 */

export type UserStatus = "active" | "invited" | "suspended";

export interface DbUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string; // ISO date
}

/** All demo accounts share this password (mock only, obviously). */
export const DEMO_PASSWORD = "Demo@123";

const FIRST_NAMES = [
  "Liam", "Emma", "Noah", "Olivia", "Ethan", "Ava", "Lucas", "Mia",
  "Mason", "Sophia", "Logan", "Isabella", "James", "Amelia", "Henry",
  "Harper", "Minh", "Linh", "An", "Khanh", "Bao", "Thao", "Duc", "Trang",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Brown", "Taylor", "Anderson", "Nguyen", "Tran",
  "Pham", "Le", "Hoang", "Garcia", "Martinez",
];

/** Fixed epoch so the seed is stable across restarts. */
const SEED_BASE_MS = Date.UTC(2026, 5, 30); // 2026-06-30
const DAY_MS = 24 * 60 * 60 * 1000;

function seedUsers(): DbUser[] {
  const demoAccounts: DbUser[] = [
    {
      id: "usr_001",
      name: "Ada Admin",
      email: "admin@acme.io",
      role: "admin",
      status: "active",
      createdAt: new Date(SEED_BASE_MS - 400 * DAY_MS).toISOString(),
    },
    {
      id: "usr_002",
      name: "Morgan Manager",
      email: "manager@acme.io",
      role: "manager",
      status: "active",
      createdAt: new Date(SEED_BASE_MS - 320 * DAY_MS).toISOString(),
    },
    {
      id: "usr_003",
      name: "Vera Viewer",
      email: "viewer@acme.io",
      role: "viewer",
      status: "active",
      createdAt: new Date(SEED_BASE_MS - 250 * DAY_MS).toISOString(),
    },
  ];

  const generated: DbUser[] = Array.from({ length: 44 }, (_, i) => {
    const first = FIRST_NAMES[(i * 7 + 3) % FIRST_NAMES.length];
    const last = LAST_NAMES[(i * 5 + 1) % LAST_NAMES.length];
    const role: Role = i % 11 === 0 ? "admin" : i % 3 === 0 ? "manager" : "viewer";
    const status: UserStatus =
      i % 13 === 0 ? "suspended" : i % 5 === 0 ? "invited" : "active";

    return {
      id: `usr_${String(i + 4).padStart(3, "0")}`,
      name: `${first} ${last}`,
      email: `${first}.${last}${i}@example.com`.toLowerCase(),
      role,
      status,
      // Spread signups over ~11 months, denser toward the present.
      createdAt: new Date(
        SEED_BASE_MS - Math.round((i * 7.3 + (i % 5) * 1.7) * DAY_MS),
      ).toISOString(),
    };
  });

  return [...demoAccounts, ...generated];
}

// ===========================================================================
// Organization / RBAC mock data (see thiet-ke-phan-quyen-rbac.md)
// Platform → Company → Project → Team (TVGS / Nhà Thầu / Thí Nghiệm).
// ===========================================================================
export type OrgCompanyStatus = "ACTIVE" | "SUSPENDED";
export type OrgRole = "COMPANY_ADMIN" | "COMPANY_DELEGATE" | "COMPANY_MEMBER";
export type OrgTeamType = "SUPERVISION" | "CONTRACTOR" | "TESTING";

export interface DbCompany {
  id: string;
  name: string;
  status: OrgCompanyStatus;
  createdAt: string;
}

export interface DbMember {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: OrgRole;
  customTitle: string;
  createdAt: string;
}

export interface DbProject {
  id: string;
  companyId: string;
  name: string;
  status: OrgCompanyStatus;
  createdAt: string;
}

export interface DbTeam {
  id: string;
  projectId: string;
  parentTeamId: string | null;
  teamType: OrgTeamType;
  name: string;
  memberCount: number;
  createdAt: string;
}

function iso(daysAgo: number): string {
  return new Date(SEED_BASE_MS - daysAgo * DAY_MS).toISOString();
}

function seedCompanies(): DbCompany[] {
  return [
    { id: "com_001", name: "Tập đoàn Xây dựng Hòa Bình", status: "ACTIVE", createdAt: iso(500) },
    { id: "com_002", name: "Công ty CP Đầu tư Coteccons", status: "ACTIVE", createdAt: iso(380) },
    { id: "com_003", name: "Chủ đầu tư Vinhomes Central", status: "SUSPENDED", createdAt: iso(210) },
  ];
}

function seedMembers(): DbMember[] {
  return [
    // com_001 — a fully staffed company
    { id: "mem_001", companyId: "com_001", name: "Nguyễn Văn Tổng", email: "tonggd@hoabinh.vn", role: "COMPANY_ADMIN", customTitle: "Tổng Giám đốc", createdAt: iso(500) },
    { id: "mem_002", companyId: "com_001", name: "Trần Thị Phó", email: "photong@hoabinh.vn", role: "COMPANY_DELEGATE", customTitle: "Phó Tổng Giám đốc", createdAt: iso(480) },
    { id: "mem_003", companyId: "com_001", name: "Lê Minh Ủy", email: "uyquyen@hoabinh.vn", role: "COMPANY_DELEGATE", customTitle: "Giám đốc Dự án", createdAt: iso(300) },
    { id: "mem_004", companyId: "com_001", name: "Phạm Quốc Thành", email: "thanhpq@hoabinh.vn", role: "COMPANY_MEMBER", customTitle: "", createdAt: iso(260) },
    { id: "mem_005", companyId: "com_001", name: "Hoàng Thị Lan", email: "lanht@hoabinh.vn", role: "COMPANY_MEMBER", customTitle: "", createdAt: iso(120) },
    // com_002
    { id: "mem_006", companyId: "com_002", name: "Đỗ Văn Cường", email: "cuongdv@coteccons.vn", role: "COMPANY_ADMIN", customTitle: "Tổng Giám đốc", createdAt: iso(380) },
    { id: "mem_007", companyId: "com_002", name: "Vũ Thị Hồng", email: "hongvt@coteccons.vn", role: "COMPANY_MEMBER", customTitle: "", createdAt: iso(150) },
    // com_003
    { id: "mem_008", companyId: "com_003", name: "Bùi Anh Dũng", email: "dungba@vinhomes.vn", role: "COMPANY_ADMIN", customTitle: "Tổng Giám đốc", createdAt: iso(210) },
  ];
}

function seedProjects(): DbProject[] {
  return [
    { id: "prj_001", companyId: "com_001", name: "Cao ốc Landmark 81 — Giai đoạn 2", status: "ACTIVE", createdAt: iso(400) },
    { id: "prj_002", companyId: "com_001", name: "Khu đô thị Ecopark Grand", status: "ACTIVE", createdAt: iso(200) },
    { id: "prj_003", companyId: "com_002", name: "Nhà máy Nhiệt điện Vũng Áng", status: "ACTIVE", createdAt: iso(300) },
  ];
}

function seedTeams(): DbTeam[] {
  return [
    // prj_001 — two independent supervision roots (TVGS), each with children.
    { id: "tea_001", projectId: "prj_001", parentTeamId: null, teamType: "SUPERVISION", name: "TVGS Nhóm 1 — Kết cấu", memberCount: 4, createdAt: iso(390) },
    { id: "tea_002", projectId: "prj_001", parentTeamId: "tea_001", teamType: "CONTRACTOR", name: "Nhà Thầu A — Cơ điện", memberCount: 6, createdAt: iso(380) },
    { id: "tea_003", projectId: "prj_001", parentTeamId: "tea_001", teamType: "TESTING", name: "Thí Nghiệm A — Bê tông", memberCount: 3, createdAt: iso(370) },
    { id: "tea_004", projectId: "prj_001", parentTeamId: null, teamType: "SUPERVISION", name: "TVGS Nhóm 2 — Hạ tầng", memberCount: 3, createdAt: iso(360) },
    { id: "tea_005", projectId: "prj_001", parentTeamId: "tea_004", teamType: "CONTRACTOR", name: "Nhà Thầu B — San lấp", memberCount: 5, createdAt: iso(350) },
  ];
}

interface MockDb {
  users: DbUser[];
  nextId: number;
  companies: DbCompany[];
  members: DbMember[];
  projects: DbProject[];
  teams: DbTeam[];
  nextOrgId: number;
}

const globalStore = globalThis as unknown as { __mockDb?: MockDb };

export function getDb(): MockDb {
  if (!globalStore.__mockDb) {
    const users = seedUsers();
    globalStore.__mockDb = {
      users,
      nextId: users.length + 1,
      companies: seedCompanies(),
      members: seedMembers(),
      projects: seedProjects(),
      teams: seedTeams(),
      nextOrgId: 1000,
    };
  }
  return globalStore.__mockDb;
}

export function allocateUserId(): string {
  const db = getDb();
  return `usr_${String(db.nextId++).padStart(3, "0")}`;
}

/** Allocate an id for any organization entity (company/member/project/team). */
export function allocateOrgId(prefix: string): string {
  const db = getDb();
  return `${prefix}_${db.nextOrgId++}`;
}

/** Simulated network latency so loading states are visible in dev. */
export function simulateLatency(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
