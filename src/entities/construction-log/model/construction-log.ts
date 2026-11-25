/** Entity nhật ký thi công (MAD-10/16), backed by Django apps.diaries. */

export const LOG_STATUS_TABS = [
  { key: "all", labelKey: "tabAll" },
  { key: "submitted", labelKey: "tabSubmitted" },
  { key: "signed", labelKey: "tabSigned" },
  { key: "needs_revision", labelKey: "tabRevision" },
] as const;
export type LogStatusTab = (typeof LOG_STATUS_TABS)[number]["key"];

export interface DailyAcceptance {
  code: string;
  requestCode: string;
  /** Hạng mục (fallback chủng loại vật liệu / mô tả công việc). */
  category: string;
  /** Loại biên bản: Công việc / Vật liệu. */
  typeLabel: string;
  /** Thời gian biên bản HH:MM. */
  time: string;
}

export interface ConstructionLog {
  id: string;
  logDate: string;
  weather: string;
  personnel: string;
  equipment: string;
  note: string;
  // Trang 1 (NT khai) — khớp mẫu PDF
  documents: string;
  commandCount: number | null;
  workerCount: number | null;
  securityCount: number | null;
  materials: string;
  workDone: string;
  acceptanceWork: string;
  status: string;
  statusDisplay: string;
  projectName: string | null;
  contractorTeamName: string | null;
  createdByName: string | null;
  signedByName: string | null;
  signedAt: string | null;
  // Trang 2 (đánh giá + nhận xét + xác nhận)
  safetyOk: boolean | null;
  sanitationOk: boolean | null;
  supervisorComment: string;
  contractorReplySupervisor: string;
  investorComment: string;
  contractorReplyInvestor: string;
  supervisorConfirmedByName: string | null;
  supervisorConfirmedAt: string | null;
  investorConfirmedByName: string | null;
  investorConfirmedAt: string | null;
  // Khối "✓ Đã ký … + Tên" (backend dựng sẵn)
  contractorSigned: string;
  supervisorSigned: string;
  investorSigned: string;
  revisionReason: string;
  dailyAcceptance: DailyAcceptance[];
  createdAt: string;
}

/** Input tạo nhật ký (camelCase — proxy chuyển snake_case). */
export interface CreateLogInput {
  contractorTeam: string;
  /** Nhóm TVGS phụ trách nhật ký (NT chọn từ danh sách cùng gói thầu). */
  supervisorTeam?: string;
  /** Người TVGS theo dõi (chỉ người này/trưởng nhóm mới xác nhận). */
  invitedSupervisor?: string;
  logDate: string;
  weather?: string;
  equipment?: string;
  note?: string;
  documents?: string;
  commandCount?: number | null;
  workerCount?: number | null;
  securityCount?: number | null;
  materials?: string;
  workDone?: string;
  acceptanceWork?: string;
}

export interface SupervisorConfirmInput {
  safetyOk: boolean | null;
  sanitationOk: boolean | null;
  comment?: string;
}
