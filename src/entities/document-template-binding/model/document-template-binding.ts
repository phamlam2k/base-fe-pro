/** 1 dòng ánh xạ: loại chứng từ → biểu mẫu PDF (theo công ty + fallback nền tảng). */
export interface TemplateBindingRow {
  documentType: string;
  label: string;
  /** Mẫu công ty đang xem đã gán (giá trị Select có thể sửa). null = chưa gán. */
  templateId: string | null;
  /** Mẫu thực thi sau fallback (công ty hoặc nền tảng). */
  effectiveTemplateId: string | null;
  effectiveTemplateName: string | null;
  source: "company" | "platform" | null;
}

/** Kết quả resolve mẫu mặc định cho 1 loại (dùng cho xuất đơn lẻ). */
export interface ResolvedTemplate {
  templateId: string | null;
  templateName: string | null;
}
