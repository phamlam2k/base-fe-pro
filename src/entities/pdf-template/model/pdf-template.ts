export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'signature'

export interface FieldStyle {
  fontSize: number
  textAlign: 'left' | 'center' | 'right'
  color: string
}

export interface FieldValidation {
  minLength?: number
  maxLength?: number
  pattern?: string
  min?: number
  max?: number
  options?: string[]
}

export interface FieldConfig {
  id: string
  label: string
  type: FieldType
  page: number
  x: number
  y: number
  width: number
  height: number
  required: boolean
  placeholder?: string
  dataKey?: string
  order: number
  validation: FieldValidation
  style: FieldStyle
}

export interface PageInfo {
  page: number
  widthPt: number
  heightPt: number
}

export interface PdfFieldSchema {
  id: string
  fields: FieldConfig[]
  version: number
  updatedAt: string
}

export interface PdfTemplate {
  id: string
  name: string
  description: string
  pageCount: number
  pagesInfo: PageInfo[]
  isPublished: boolean
  /** Công ty của mẫu (null = mẫu chung toàn nền tảng). */
  company: string | null
  companyName: string | null
  fieldSchema?: PdfFieldSchema
  createdAt: string
  updatedAt: string
}

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Văn bản',
  textarea: 'Đoạn văn',
  number: 'Số',
  date: 'Ngày tháng',
  select: 'Danh sách',
  checkbox: 'Checkbox',
  signature: 'Chữ ký',
}

export const DEFAULT_FIELD_SIZES: Record<FieldType, { width: number; height: number }> = {
  text: { width: 200, height: 20 },
  textarea: { width: 200, height: 60 },
  number: { width: 100, height: 20 },
  date: { width: 120, height: 20 },
  select: { width: 150, height: 20 },
  checkbox: { width: 15, height: 15 },
  signature: { width: 150, height: 50 },
}

export const PREFILL_KEYS: Array<{ key: string; label: string }> = [
  { key: 'fullName', label: 'Họ và tên' },
  { key: 'email', label: 'Email' },
  { key: 'phoneNumber', label: 'Số điện thoại' },
  { key: 'dateOfBirth', label: 'Ngày sinh' },
  { key: 'idNumber', label: 'Số CCCD' },
  { key: 'address', label: 'Địa chỉ' },
]

export interface PdfSubmission {
  id: string
  template: string
  templateName: string
  fieldValues: Record<string, string>
  status: 'pending' | 'processing' | 'done' | 'failed'
  errorMessage: string
  downloadUrl: string | null
  createdAt: string
}

export type PrefillFields = Record<string, string>

/** Nhóm khoá dữ liệu nghiệp vụ cho dropdown builder (MAD-27), lấy động từ backend. */
export interface PrefillCatalogSection {
  group: string
  keys: Array<{ key: string; label: string }>
}

/** Nhãn nhóm cho 6 khoá hồ sơ người dùng (PREFILL_KEYS) trong dropdown builder. */
export const PREFILL_USER_GROUP_LABEL = 'Hồ sơ người dùng'
