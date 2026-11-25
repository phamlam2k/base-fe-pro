import { z } from "zod";

/**
 * Team entity — Gói thầu (Package) / TVGS (Supervision) / Nhà Thầu (Contractor) /
 * Thí Nghiệm (Testing), forming a tree via `parentTeamId`:
 *   PACKAGE (gốc) → SUPERVISION → CONTRACTOR | TESTING.
 * See thiet-ke-phan-quyen-rbac.md.
 */
export const TEAM_TYPES = ["PACKAGE", "SUPERVISION", "CONTRACTOR", "TESTING"] as const;
export type TeamType = (typeof TEAM_TYPES)[number];

/**
 * 1 VỊ TRÍ của nhóm trong cây — 1 nhóm có thể có nhiều cha.
 * TVGS: parent = Hợp đồng (packageId = parentId). NT/PTN: parent = nhóm TVGS,
 * packageId = Hợp đồng mà TVGS đó thuộc về.
 */
export interface TeamPlacement {
  id: string;
  parentId: string;
  parentName: string;
  packageId: string | null;
  packageName: string;
}

export interface Team {
  id: string;
  projectId: string;
  /** Cha của vị trí chính (= placements[0].parentId). */
  parentTeamId: string | null;
  placements: TeamPlacement[];
  teamType: TeamType;
  name: string;
  memberCount: number;
  createdAt: string;
}

/** Nhóm như backend trả về (BFF đã camelize). */
export interface RawTeam {
  id: string;
  project: string;
  parentTeam: string | null;
  teamType: TeamType;
  name: string;
  memberCount: number;
  createdAt: string;
  placements?: Array<{
    id: string;
    parentTeam: string;
    parentTeamName: string;
    package: string | null;
    packageName: string;
  }>;
}

export function teamFromBackend(raw: RawTeam): Team {
  return {
    id: raw.id,
    projectId: raw.project,
    parentTeamId: raw.parentTeam ?? null,
    placements: (raw.placements ?? []).map((pl) => ({
      id: pl.id,
      parentId: pl.parentTeam,
      parentName: pl.parentTeamName,
      packageId: pl.package ?? null,
      packageName: pl.packageName ?? "",
    })),
    teamType: raw.teamType,
    name: raw.name,
    memberCount: raw.memberCount ?? 0,
    createdAt: raw.createdAt,
  };
}

/** Body gửi lên backend: ``placements=[{parentTeam, package}]``. */
export function placementsPayload(keys: string[]) {
  return keys.map(parsePlacementKey).map((p) => ({ parentTeam: p.parentTeam, package: p.package }));
}

type TFn = (key: string) => string;

/** Khoá 1 vị trí trong form: "<parentId>|<packageId>" (packageId rỗng nếu chưa có HĐ). */
export const placementKey = (parentId: string, packageId: string | null) =>
  `${parentId}|${packageId ?? ""}`;

export function parsePlacementKey(key: string): { parentTeam: string; package: string | null } {
  const [parentTeam, pkg] = key.split("|");
  return { parentTeam, package: pkg || null };
}

/** Vị trí có thể chọn cho 1 loại nhóm: TVGS → các Hợp đồng; NT/PTN → (TVGS · HĐ). */
export function placementOptions(teamType: TeamType, teams: Team[]) {
  if (teamType === "PACKAGE") return [];
  if (teamType === "SUPERVISION") {
    return teams
      .filter((tm) => tm.teamType === "PACKAGE")
      .map((pkg) => ({ key: placementKey(pkg.id, pkg.id), label: pkg.name }));
  }
  return teams
    .filter((tm) => tm.teamType === "SUPERVISION")
    .flatMap((sup) =>
      sup.placements.length
        ? sup.placements.map((pl) => ({
            key: placementKey(sup.id, pl.packageId),
            label: `${sup.name} · ${pl.packageName || pl.parentName}`,
          }))
        : [{ key: placementKey(sup.id, null), label: sup.name }],
    );
}

export function createTeamFormSchema(t?: TFn) {
  const msg = (key: string, fallback: string) => (t ? t(key) : fallback);
  return z
    .object({
      name: z
        .string()
        .min(2, { message: msg("validation.teamNameMin", "Tên nhóm tối thiểu 2 ký tự") }),
      teamType: z.enum(TEAM_TYPES, { message: msg("validation.teamTypeRequired", "Chọn loại nhóm") }),
      /** Rỗng cho Hợp đồng (gốc); ≥ 1 cho TVGS / Nhà Thầu / Thí Nghiệm. */
      placementKeys: z.array(z.string()),
    })
    .refine(
      (v) => (v.teamType === "PACKAGE" ? v.placementKeys.length === 0 : v.placementKeys.length > 0),
      {
        path: ["placementKeys"],
        message: msg(
          "validation.parentRequired",
          "TVGS phải thuộc ít nhất một Hợp đồng; Nhà Thầu / Thí Nghiệm phải thuộc ít nhất một nhóm TVGS",
        ),
      },
    );
}
export type TeamFormValues = z.infer<ReturnType<typeof createTeamFormSchema>>;
