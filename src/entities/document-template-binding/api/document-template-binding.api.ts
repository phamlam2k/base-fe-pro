import { apiClient } from "@/shared/api/axios";
import type {
  ResolvedTemplate,
  TemplateBindingRow,
} from "../model/document-template-binding";

export const documentTemplateBindingApi = {
  list: async (): Promise<TemplateBindingRow[]> => {
    const res = await apiClient.get<{ data: TemplateBindingRow[] }>(
      "/document-template-bindings",
    );
    return res.data.data;
  },

  /** Gán/gỡ mẫu cho 1 loại chứng từ (templateId=null để gỡ). */
  upsert: async (documentType: string, templateId: string | null): Promise<void> => {
    await apiClient.post("/document-template-bindings", {
      documentType,
      templateId,
    });
  },

  /** Mẫu mặc định đã gán cho 1 loại (dùng cho xuất đơn lẻ). */
  resolve: async (documentType: string): Promise<ResolvedTemplate> => {
    const res = await apiClient.get<{ data: ResolvedTemplate }>(
      "/document-template-bindings/resolve",
      { params: { documentType } },
    );
    return res.data.data;
  },
};
