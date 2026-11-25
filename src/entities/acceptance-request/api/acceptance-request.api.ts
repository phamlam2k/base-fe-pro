import { apiClient } from "@/shared/api/axios";
import type { ApiResponse, Paginated } from "@/shared/api/types";

import type {
  AcceptancePdfExport,
  AcceptanceRecord,
  AcceptanceRecordDetail,
  AcceptanceRequest,
  AcceptanceSummary,
  ContractorTeam,
  CreateMaterialRequestInput,
  CreateWorkRequestInput,
  InspectionInput,
  ResubmitInput,
  StagedFile,
} from "@/entities/acceptance-request/model/acceptance-request";

export const acceptanceRequestApi = {
  /** Upload-ngay: đẩy nhiều file (ảnh/PDF) lên staging → nhận [{key,url,name}]. */
  uploadStaging: async (files: File[]): Promise<StagedFile[]> => {
    if (files.length === 0) return [];
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    const res = await apiClient.post<ApiResponse<{ files: StagedFile[] }>>(
      "/acceptance-uploads",
      form,
      { headers: { "Content-Type": "multipart/form-data" }, timeout: 120_000 },
    );
    return res.data.data.files ?? [];
  },
  /** Team Nhà thầu của user + TVGS phụ trách (người mời mặc định). */
  contractorTeams: async (projectId?: string): Promise<ContractorTeam[]> => {
    const res = await apiClient.get<ApiResponse<ContractorTeam[]>>(
      "/acceptance-requests/contractor-teams",
      { params: { ...(projectId ? { project: projectId } : {}) } },
    );
    return res.data.data;
  },
  createWork: async (input: CreateWorkRequestInput): Promise<AcceptanceRequest> => {
    const res = await apiClient.post<ApiResponse<AcceptanceRequest>>(
      "/acceptance-requests",
      input,
    );
    return res.data.data;
  },
  createMaterial: async (
    input: CreateMaterialRequestInput,
  ): Promise<AcceptanceRequest> => {
    const res = await apiClient.post<ApiResponse<AcceptanceRequest>>(
      "/acceptance-requests",
      input,
    );
    return res.data.data;
  },
  /** MAD-13 — NT bổ sung & gửi lại phiếu bị 'Yêu cầu bổ sung' → về Chờ xác nhận. */
  resubmit: async (
    id: string,
    input: ResubmitInput,
  ): Promise<AcceptanceRequest> => {
    const res = await apiClient.post<ApiResponse<AcceptanceRequest>>(
      `/acceptance-requests/${id}/resubmit`,
      input,
    );
    return res.data.data;
  },
  /** MAD-8/9 — đính kèm nhiều ảnh hiện trạng (multipart). */
  uploadPhotos: async (id: string, files: File[]): Promise<void> => {
    if (files.length === 0) return;
    const form = new FormData();
    files.forEach((f) => form.append("images", f));
    // Ghi đè Content-Type mặc định (application/json) để trình duyệt tự set
    // multipart/form-data + boundary — nếu không, backend nhận sai và ảnh KHÔNG lên.
    await apiClient.post(`/acceptance-requests/${id}/photos`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  /** MAD-8 — đính kèm hóa đơn PDF (multipart). */
  uploadInvoice: async (id: string, file: File): Promise<void> => {
    const form = new FormData();
    form.append("file", file);
    await apiClient.post(`/acceptance-requests/${id}/invoice`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  /** MAD-11 — danh sách biên bản nghiệm thu (phân trang). */
  records: async (
    page = 1,
    projectId?: string,
  ): Promise<Paginated<AcceptanceRecord>> => {
    const res = await apiClient.get<ApiResponse<Paginated<AcceptanceRecord>>>(
      "/acceptance-records",
      { params: { page, ...(projectId ? { project: projectId } : {}) } },
    );
    return res.data.data;
  },
  /** Xuất GỘP nhiều biên bản → tự điền vào mẫu theo LOẠI → 1 PDF. Trả URL tải. */
  exportMergedRecords: async (recordIds: string[]): Promise<string> => {
    const res = await apiClient.post<ApiResponse<{ downloadUrl: string }>>(
      "/acceptance-records/export-merged",
      { recordIds },
    );
    return res.data.data.downloadUrl;
  },
  /** Chi tiết 1 biên bản (ảnh hiện trường, xác nhận 2 bên, phủ quyết). */
  record: async (id: string): Promise<AcceptanceRecordDetail> => {
    const res = await apiClient.get<ApiResponse<AcceptanceRecordDetail>>(
      `/acceptance-records/${id}`,
    );
    return res.data.data;
  },
  /** CĐT phủ quyết biên bản (kèm lý do). */
  vetoRecord: async (
    id: string,
    reason: string,
  ): Promise<AcceptanceRecordDetail> => {
    const res = await apiClient.post<ApiResponse<AcceptanceRecordDetail>>(
      `/acceptance-records/${id}/veto`,
      { reason },
    );
    return res.data.data;
  },
  /** MAD-5 — KPI tổng hợp cho trang chủ. */
  summary: async (projectId?: string): Promise<AcceptanceSummary> => {
    const res = await apiClient.get<ApiResponse<AcceptanceSummary>>(
      "/acceptance-requests/summary",
      { params: { ...(projectId ? { project: projectId } : {}) } },
    );
    return res.data.data;
  },
  /** MAD-12 — danh sách phiếu, lọc theo trạng thái + dự án (phân trang). */
  list: async (
    status?: string,
    page = 1,
    projectId?: string,
  ): Promise<Paginated<AcceptanceRequest>> => {
    const res = await apiClient.get<ApiResponse<Paginated<AcceptanceRequest>>>(
      "/acceptance-requests",
      {
        params: {
          ...(status ? { status } : {}),
          page,
          ...(projectId ? { project: projectId } : {}),
        },
      },
    );
    return res.data.data;
  },
  /** MAD-13 — chi tiết 1 phiếu (kèm events). */
  getById: async (id: string): Promise<AcceptanceRequest> => {
    const res = await apiClient.get<ApiResponse<AcceptanceRequest>>(
      `/acceptance-requests/${id}`,
    );
    return res.data.data;
  },
  confirm: async (id: string): Promise<AcceptanceRequest> => {
    const res = await apiClient.post<ApiResponse<AcceptanceRequest>>(
      `/acceptance-requests/${id}/confirm`,
    );
    return res.data.data;
  },
  /** Luồng mới — PTN xác nhận yêu cầu (phiếu Cần thí nghiệm). */
  confirmTesting: async (id: string): Promise<AcceptanceRequest> => {
    const res = await apiClient.post<ApiResponse<AcceptanceRequest>>(
      `/acceptance-requests/${id}/confirm-testing`,
    );
    return res.data.data;
  },
  /** Luồng mới MAD-18 — NT nộp 1 file kết quả thí nghiệm (multipart). */
  uploadResult: async (id: string, file: File): Promise<AcceptanceRequest> => {
    const form = new FormData();
    form.append("file", file);
    const res = await apiClient.post<ApiResponse<AcceptanceRequest>>(
      `/acceptance-requests/${id}/result`,
      form,
    );
    return res.data.data;
  },
  requestSupplement: async (
    id: string,
    reason: string,
  ): Promise<AcceptanceRequest> => {
    const res = await apiClient.post<ApiResponse<AcceptanceRequest>>(
      `/acceptance-requests/${id}/request-supplement`,
      { reason },
    );
    return res.data.data;
  },
  /** TVGS dời thời gian nghiệm thu (proposedAt) — phiếu chưa nghiệm thu xong. */
  reschedule: async (
    id: string,
    input: { proposedAt: string; reason?: string },
  ): Promise<AcceptanceRequest> => {
    const res = await apiClient.post<ApiResponse<AcceptanceRequest>>(
      `/acceptance-requests/${id}/reschedule`,
      { proposedAt: input.proposedAt, reason: input.reason ?? "" },
    );
    return res.data.data;
  },
  /** MAD-14 — nghiệm thu hiện trường. */
  perform: async (
    id: string,
    input: InspectionInput,
  ): Promise<{ recordCode: string | null }> => {
    const res = await apiClient.post<ApiResponse<{ recordCode: string | null }>>(
      `/acceptance-requests/${id}/perform`,
      input,
    );
    return res.data.data;
  },
  /** MAD-27 — các bản PDF đã xuất từ phiếu này (truy vết). */
  pdfSubmissions: async (id: string): Promise<AcceptancePdfExport[]> => {
    const res = await apiClient.get<ApiResponse<AcceptancePdfExport[]>>(
      `/acceptance-requests/${id}/pdf-submissions`,
    );
    return res.data.data;
  },
};
