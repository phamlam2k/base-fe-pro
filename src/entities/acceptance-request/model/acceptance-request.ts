/** Entity phiếu yêu cầu nghiệm thu (MAD-8/9), backed by Django apps.acceptance. */
import type { ProjectGeofence } from "@/shared/lib/geofence";

/**
 * Màu badge theo trạng thái/kết quả nghiệm thu:
 *   Chấp thuận (approved) → xanh lá; Từ chối/Phủ quyết (rejected/vetoed) → đỏ;
 *   còn lại (chờ xác nhận / đã xác nhận / bổ sung / khắc phục) → vàng.
 * Dùng chung cho badge phiếu yêu cầu (status) và biên bản (result).
 */
export function statusColorClass(value: string): string {
  if (value === "approved") return "text-green-600";
  if (value === "rejected" || value === "vetoed") return "text-red-600";
  return "text-amber-600";
}

/**
 * Phiếu đã QUÁ thời gian bắt đầu nghiệm thu (proposedAt) mà còn ở giai đoạn chờ.
 * Tính client-side (real-time theo đồng hồ máy) — dùng để khoá nút + badge tức thời;
 * BE cũng trả `isOverdue` (nguồn chuẩn) + enforce khi xác nhận.
 */
export function isRequestOverdue(req: {
  proposedAt: string | null;
  status: string;
  isOverdue?: boolean;
}): boolean {
  if (req.isOverdue) return true;
  if (!req.proposedAt) return false;
  const pending = ["pending", "supplement", "confirmed"].includes(req.status);
  return pending && new Date(req.proposedAt).getTime() < Date.now();
}

export const WORK_LEVELS = [
  { value: "work", labelKey: "levelWork" },
  { value: "part_phase", labelKey: "levelPartPhase" },
  { value: "item_completion", labelKey: "levelItemCompletion" },
] as const;
export type WorkLevel = (typeof WORK_LEVELS)[number]["value"];

/**
 * 1 mục "Hợp đồng" NT chọn khi tạo phiếu / nhật ký = 1 VỊ TRÍ của nhóm NT
 * (nhóm TVGS + Hợp đồng). ``id`` = id vị trí, gửi lại qua ``contractorTeam``.
 */
export interface ContractorTeam {
  id: string;
  /** Nhóm Nhà thầu thật (1 nhóm có thể có nhiều mục — mỗi hợp đồng 1 mục). */
  contractorTeamId: string;
  placementId: string | null;
  name: string;
  /** GÓI THẦU của nhóm Nhà thầu — NT chọn phiếu theo gói thầu. */
  packageId: string | null;
  packageName: string;
  supervisorTeamName: string;
  supervisorName: string;
  /** Trưởng nhóm TVGS phụ trách (mặc định người theo dõi phiếu). */
  supervisorLeadId: string | null;
  /** Thành viên nhóm TVGS phụ trách — NT chọn người theo dõi phiếu. */
  supervisors: Array<{ id: string; fullName: string; role: string }>;
  /** Nhóm TVGS phụ trách mặc định (cha trực tiếp) — dùng cho nhật ký. */
  supervisorTeamId: string | null;
  /** Các nhóm TVGS trong cùng gói thầu (kèm thành viên) để NT chọn khi tạo nhật ký. */
  supervisorTeams: Array<{
    id: string;
    name: string;
    members: Array<{ id: string; fullName: string; role: string }>;
    defaultSupervisorId: string | null;
  }>;
}

export interface AcceptanceEvent {
  id: string;
  action: string;
  actionDisplay: string;
  actorName: string | null;
  reason: string;
  createdAt: string;
}

/** Ảnh hiện trạng NT gửi kèm phiếu (lưu MinIO, `image` là URL đã ký). */
export interface RequestPhoto {
  id: string;
  image: string;
  createdAt: string;
}

export interface AcceptanceRequest {
  id: string;
  code: string;
  type: "material" | "work";
  typeDisplay: string;
  status: string;
  statusDisplay: string;
  contractorTeam?: string | null;
  contractorTeamName: string | null;
  projectName: string | null;
  // Gói thầu + Địa điểm lấy từ dự án (read-only trên phiếu).
  projectContractPackage?: string | null;
  projectLocation?: string | null;
  construction: string;
  contractPackage: string;
  category: string;
  location: string;
  materialType: string;
  quantity: string;
  description: string;
  levelDisplay: string;
  proposedAt: string | null;
  // Đã quá thời gian bắt đầu nghiệm thu (proposed_at) — BE tính lúc đọc.
  isOverdue?: boolean;
  needsSampling: boolean;
  // Luồng mới: xác nhận 2 bên (TVGS + PTN nếu cần thí nghiệm) + file kết quả do NT nộp.
  testingTeam: string | null;
  testingTeamName: string | null;
  supervisorConfirmedAt: string | null;
  testingConfirmedAt: string | null;
  resultFile: string | null;
  resultFileName: string | null;
  resultUploadedAt: string | null;
  hasResult: boolean;
  // Truy vết: phiếu này tạo lại dựa trên phiếu đã bị CĐT phủ quyết.
  basedOn?: string | null;
  basedOnCode?: string | null;
  // Biên bản nghiệm thu (chỉ có khi phiếu đã approved) → dẫn sang trang biên bản.
  recordId?: string | null;
  recordCode?: string | null;
  events?: AcceptanceEvent[];
  photos?: RequestPhoto[];
  invoice?: string | null;
  /** Vùng dự án (geofence) — web chặn nghiệm thu hiện trường ngoài vùng. null nếu chưa vẽ. */
  projectGeofence?: ProjectGeofence | null;
}

export interface AcceptanceRecord {
  id: string;
  code: string;
  result: string;
  resultDisplay: string;
  type: "material" | "work";
  typeDisplay: string;
  requestCode: string;
  contractorTeamName: string | null;
  item: string;
  createdAt: string;
}

/** Chi tiết biên bản: ảnh hiện trường, xác nhận 2 bên (NT+TVGS), phủ quyết CĐT. */
export interface AcceptanceRecordDetail extends AcceptanceRecord {
  requestId: string;
  requestStatus: string;
  requestStatusDisplay: string;
  inspectionPhotos: string[];
  /** Ảnh hiện trạng đính kèm PHIẾU YÊU CẦU (khác ảnh nghiệm thu hiện trường). */
  requestPhotos?: RequestPhoto[];
  contractorName: string;
  contractorConfirmedAt: string | null;
  supervisorName: string;
  supervisorConfirmedAt: string | null;
  resultFile: string | null;
  resultFileName: string | null;
  vetoReason: string;
  vetoedByName: string;
  vetoedAt: string | null;
}

export const INSPECTION_RESULTS = [
  { value: "approved", labelKey: "resultApproved" },
  { value: "remediate", labelKey: "resultRemediate" },
  { value: "rejected", labelKey: "resultRejected" },
] as const;
export type InspectionResultValue = (typeof INSPECTION_RESULTS)[number]["value"];

export interface RemediationItemInput {
  criterion: string;
  passed: boolean;
  reason: string;
}

export interface InspectionInput {
  result: InspectionResultValue;
  fieldPhotos: string[];
  reason?: string;
  gpsOutsideRadius?: boolean;
  signaturePhoto: string; // MAD-7: ảnh khuôn mặt lúc ký (bắt buộc)
  gpsLat?: number;
  gpsLng?: number;
  remediationItems?: RemediationItemInput[];
  // Mốc bắt đầu phiên nghiệm thu (app ghi khi mở màn); kết thúc do backend đặt.
  startedAt?: string;
  // Tài liệu PDF TVGS đính khi nghiệm thu (upload-ngay) → key.
  attachmentKeys?: string[];
}

export interface AcceptanceSummary {
  pending: number;
  supplement: number;
  confirmed: number;
  approved: number;
  remediate: number;
  rejected: number;
  vetoed: number;
  total: number;
}

export const ACCEPTANCE_TABS = [
  { key: "all", labelKey: "tabAll" },
  { key: "pending", labelKey: "tabPending" },
  { key: "supplement", labelKey: "tabSupplement" },
  { key: "confirmed", labelKey: "tabConfirmed" },
] as const;
export type AcceptanceTab = (typeof ACCEPTANCE_TABS)[number]["key"];

/** Input tạo phiếu công việc (camelCase — proxy sẽ chuyển snake_case cho Django). */
export interface CreateWorkRequestInput {
  type: "work";
  contractorTeam: string;
  /** Người TVGS theo dõi (NT chọn) — chỉ người này/trưởng nhóm xác nhận + nghiệm thu. */
  invitedSupervisor?: string;
  level: WorkLevel;
  description: string;
  construction?: string;
  contractPackage?: string;
  category?: string;
  location?: string;
  proposedAt?: string | null;
  // MAD-37 — mời PTN đồng hành kiểm tra hiện trường (không chặn cứng nghiệm thu).
  needsSampling?: boolean;
  // Tạo lại dựa trên phiếu đã bị CĐT phủ quyết (id phiếu gốc).
  basedOn?: string;
  // Upload-ngay: key ảnh hiện trạng + tài liệu PDF đã upload trước.
  photoKeys?: string[];
  attachmentKeys?: string[];
}

/** File đã upload-ngay (staging) — client giữ `key` để gắn vào phiếu. */
export interface StagedFile {
  key: string;
  url: string;
  name: string;
}

/** Input tạo phiếu vật liệu. */
export interface CreateMaterialRequestInput {
  type: "material";
  contractorTeam: string;
  /** Người TVGS theo dõi (NT chọn). */
  invitedSupervisor?: string;
  materialType: string;
  quantity: string;
  origin?: string;
  /** Đối tượng nghiệm thu (mô tả) — phiếu vật liệu cũng nhập như công việc. */
  description?: string;
  construction?: string;
  contractPackage?: string;
  category?: string;
  location?: string;
  proposedAt?: string | null;
  needsSampling?: boolean;
  basedOn?: string;
  // Upload-ngay: key ảnh hiện trạng + hoá đơn/CO-CQ + tài liệu PDF đã upload trước.
  photoKeys?: string[];
  invoiceKey?: string;
  attachmentKeys?: string[];
}

/** MAD-27 — 1 bản PDF đã xuất từ phiếu (truy vết). */
export interface AcceptancePdfExport {
  id: string;
  templateName: string;
  status: "pending" | "processing" | "done" | "failed";
  downloadUrl: string | null;
  createdAt: string;
}

/** MAD-13 — NT bổ sung & gửi lại (các field cho phép sửa; KHÔNG đổi loại/team). */
export interface ResubmitInput {
  materialType?: string;
  quantity?: string;
  origin?: string;
  level?: WorkLevel;
  description?: string;
  construction?: string;
  contractPackage?: string;
  category?: string;
  location?: string;
  proposedAt?: string | null;
  needsSampling?: boolean;
  photoKeys?: string[];
  invoiceKey?: string;
  attachmentKeys?: string[];
}
