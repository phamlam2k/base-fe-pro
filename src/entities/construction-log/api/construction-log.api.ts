import { apiClient } from "@/shared/api/axios";
import type { ApiResponse, Paginated } from "@/shared/api/types";

import type {
  ConstructionLog,
  CreateLogInput,
  DailyAcceptance,
  SupervisorConfirmInput,
} from "@/entities/construction-log/model/construction-log";

export const constructionLogApi = {
  list: async (
    status?: string,
    page = 1,
    projectId?: string,
  ): Promise<Paginated<ConstructionLog>> => {
    const res = await apiClient.get<ApiResponse<Paginated<ConstructionLog>>>(
      "/construction-logs",
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
  getById: async (id: string): Promise<ConstructionLog> => {
    const res = await apiClient.get<ApiResponse<ConstructionLog>>(
      `/construction-logs/${id}`,
    );
    return res.data.data;
  },
  /** Preview "Công tác nghiệm thu" lúc TẠO: biên bản Chấp thuận của team NT trong ngày. */
  dailyAcceptancePreview: async (
    contractorTeam: string,
    date: string,
  ): Promise<DailyAcceptance[]> => {
    const res = await apiClient.get<ApiResponse<DailyAcceptance[]>>(
      "/construction-logs/daily-acceptance",
      { params: { contractor_team: contractorTeam, date } },
    );
    return res.data.data;
  },
  create: async (input: CreateLogInput): Promise<ConstructionLog> => {
    const res = await apiClient.post<ApiResponse<ConstructionLog>>(
      "/construction-logs",
      input,
    );
    return res.data.data;
  },
  /** MAD-16 + MAD-7 — TVGS ký duyệt kèm ảnh khuôn mặt (sinh trắc) + GPS. */
  sign: async (
    id: string,
    sign: { signaturePhoto: string; gpsLat?: number; gpsLng?: number },
  ): Promise<ConstructionLog> => {
    const res = await apiClient.post<ApiResponse<ConstructionLog>>(
      `/construction-logs/${id}/sign`,
      sign,
    );
    return res.data.data;
  },
  /** MAD-16 — TVGS trả về NT chỉnh sửa. */
  requestRevision: async (id: string, reason: string): Promise<ConstructionLog> => {
    const res = await apiClient.post<ApiResponse<ConstructionLog>>(
      `/construction-logs/${id}/request-revision`,
      { reason },
    );
    return res.data.data;
  },
  /** TVGS đánh giá (An toàn/Vệ sinh) + nhận xét + XÁC NHẬN (không sinh trắc). */
  supervisorConfirm: async (
    id: string,
    input: SupervisorConfirmInput,
  ): Promise<ConstructionLog> => {
    const res = await apiClient.post<ApiResponse<ConstructionLog>>(
      `/construction-logs/${id}/supervisor-confirm`,
      input,
    );
    return res.data.data;
  },
  /** CĐT nhận xét + XÁC NHẬN (tuỳ chọn). */
  investorConfirm: async (id: string, comment: string): Promise<ConstructionLog> => {
    const res = await apiClient.post<ApiResponse<ConstructionLog>>(
      `/construction-logs/${id}/investor-confirm`,
      { comment },
    );
    return res.data.data;
  },
  /** NT ghi 'Ý kiến tiếp thu' phản hồi nhận xét TVGS/CĐT. */
  contractorReply: async (
    id: string,
    input: { replySupervisor?: string; replyInvestor?: string },
  ): Promise<ConstructionLog> => {
    const res = await apiClient.post<ApiResponse<ConstructionLog>>(
      `/construction-logs/${id}/contractor-reply`,
      input,
    );
    return res.data.data;
  },
  /** Xuất PDF nhật ký theo mẫu → trả URL tải. */
  exportPdf: async (id: string): Promise<string> => {
    const res = await apiClient.post<ApiResponse<{ downloadUrl: string }>>(
      `/construction-logs/${id}/pdf`,
      {},
    );
    return res.data.data.downloadUrl;
  },
  /** Xuất GỘP nhiều nhật ký → tự điền vào mẫu đã gán theo loại → 1 PDF. Trả URL tải. */
  exportMergedLogs: async (logIds: string[]): Promise<string> => {
    const res = await apiClient.post<ApiResponse<{ downloadUrl: string }>>(
      "/construction-logs/export-merged",
      { logIds },
    );
    return res.data.data.downloadUrl;
  },
};
