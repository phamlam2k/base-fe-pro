import { apiClient } from '@/shared/api/axios'
import type {
  PdfFieldSchema,
  PdfTemplate,
  FieldConfig,
  PdfSubmission,
  PrefillFields,
  PrefillCatalogSection,
} from '../model/pdf-template'

export const pdfTemplateApi = {
  list: async (): Promise<PdfTemplate[]> => {
    const res = await apiClient.get<{ data: PdfTemplate[] }>('/pdf-templates')
    return res.data.data
  },

  get: async (id: string): Promise<PdfTemplate> => {
    const res = await apiClient.get<{ data: PdfTemplate }>(`/pdf-templates/${id}`)
    return res.data.data
  },

  upload: async (formData: FormData): Promise<PdfTemplate> => {
    const res = await apiClient.post<{ data: PdfTemplate }>('/pdf-templates', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  },

  getSchema: async (id: string): Promise<PdfFieldSchema> => {
    const res = await apiClient.get<{ data: PdfFieldSchema }>(`/pdf-templates/${id}/field-schema`)
    return res.data.data
  },

  saveSchema: async (id: string, fields: FieldConfig[]): Promise<PdfFieldSchema> => {
    const res = await apiClient.put<{ data: PdfFieldSchema }>(
      `/pdf-templates/${id}/field-schema`,
      { fields },
    )
    return res.data.data
  },

  pageImageUrl: (id: string, page: number): string =>
    `/api/pdf-templates/${id}/pages/${page}`,

  // Sửa tên (và mô tả) biểu mẫu — chỉ người quản lý mẫu (backend chặn).
  updateInfo: async (
    id: string,
    input: { name: string; description?: string },
  ): Promise<PdfTemplate> => {
    const res = await apiClient.post<{ data: PdfTemplate }>(
      `/pdf-templates/${id}/rename`,
      input,
    )
    return res.data.data
  },

  // Xuất bản / thu hồi mẫu (staff only — backend chặn). published=false để thu hồi.
  setPublished: async (id: string, published: boolean): Promise<PdfTemplate> => {
    const res = await apiClient.post<{ data: PdfTemplate }>(
      `/pdf-templates/${id}/publish`,
      { published },
    )
    return res.data.data
  },

  getPrefillFields: async (): Promise<PrefillFields> => {
    const res = await apiClient.get<{ data: PrefillFields }>('/users/me/prefill-fields')
    return res.data.data
  },

  // MAD-27 — giá trị khoá nghiệp vụ của 1 phiếu nghiệm thu (map vào dataKey).
  getAcceptancePrefillFields: async (requestId: string): Promise<PrefillFields> => {
    const res = await apiClient.get<{ data: PrefillFields }>(
      `/acceptance-requests/${requestId}/prefill-fields`,
    )
    return res.data.data
  },

  // MAD-27 — danh mục khoá nghiệp vụ (gom nhóm) cho dropdown builder.
  getPrefillCatalog: async (): Promise<PrefillCatalogSection[]> => {
    const res = await apiClient.get<{ data: PrefillCatalogSection[] }>(
      '/acceptance-requests/prefill-catalog',
    )
    return res.data.data
  },

  // Danh mục khoá nhật ký (gom nhóm) cho dropdown builder — nguồn NHẬT KÝ.
  getDiaryPrefillCatalog: async (): Promise<PrefillCatalogSection[]> => {
    const res = await apiClient.get<{ data: PrefillCatalogSection[] }>(
      '/construction-logs/prefill-catalog',
    )
    return res.data.data
  },

  // Giá trị khoá của 1 nhật ký (map vào dataKey).
  getDiaryPrefillFields: async (logId: string): Promise<PrefillFields> => {
    const res = await apiClient.get<{ data: PrefillFields }>(
      `/construction-logs/${logId}/prefill-fields`,
    )
    return res.data.data
  },

  submitForm: async (
    id: string,
    fieldValues: Record<string, string>,
    acceptanceRequestId?: string,
    constructionLogId?: string,
  ): Promise<PdfSubmission> => {
    const res = await apiClient.post<{ data: PdfSubmission }>(
      `/pdf-templates/${id}/submit`,
      // Gắn truy vết khi xuất từ 1 phiếu nghiệm thu (MAD-27) hoặc 1 nhật ký.
      {
        fieldValues,
        ...(acceptanceRequestId ? { acceptanceRequestId } : {}),
        ...(constructionLogId ? { constructionLogId } : {}),
      },
    )
    return res.data.data
  },

  submissionDownloadUrl: (id: string): string => `/api/pdf-submissions/${id}/download`,
}
