'use client'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { Control, UseFormRegister } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Download, FileCheck, Loader2, Wand2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { pdfTemplateApi, pdfTemplateQueries } from '@/entities/pdf-template'
import type { FieldConfig, PdfSubmission } from '@/entities/pdf-template'
import { ROUTES } from '@/shared/config/routes'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import { PdfPreviewCanvas } from './pdf-preview-canvas'

interface FormRendererPageProps {
  id: string
  /** MAD-27 — khi mở từ 1 phiếu nghiệm thu: prefill thêm dữ liệu phiếu vào các ô. */
  acceptanceRequestId?: string
  /** Khi mở từ 1 nhật ký thi công: prefill thêm dữ liệu nhật ký vào các ô. */
  constructionLogId?: string
}

interface FieldRowProps {
  field: FieldConfig
  register: UseFormRegister<Record<string, string>>
  control: Control<Record<string, string>>
  error?: string
}

function FieldRow({ field, register, control, error }: FieldRowProps) {
  const validation = field.required ? { required: `${field.label} là bắt buộc` } : {}

  if (field.type === 'signature') {
    // Chữ ký dạng chữ: dòng xác nhận TVGS đã chấp thuận (có thể tự điền từ dataKey
    // signedStatement — "Đã ký … + tên TVGS"). Nhiều dòng nên dùng textarea.
    return (
      <div className="grid gap-1.5">
        <Label htmlFor={field.id} className="text-sm font-medium">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Textarea
          id={field.id}
          placeholder={field.placeholder ?? 'VD: Đã ký … ngày … tháng … năm … + tên TVGS'}
          rows={2}
          {...register(field.id, validation)}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    )
  }

  if (field.type === 'checkbox') {
    return (
      <div className="flex items-start gap-3">
        <Controller
          name={field.id}
          control={control}
          render={({ field: f }) => (
            <Checkbox
              id={field.id}
              checked={f.value === 'true'}
              onCheckedChange={(checked) => f.onChange(checked ? 'true' : 'false')}
              className="mt-0.5"
            />
          )}
        />
        <div className="grid gap-1">
          <label htmlFor={field.id} className="text-sm font-medium cursor-pointer leading-none">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </label>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </div>
    )
  }

  if (field.type === 'select') {
    const options = field.validation?.options ?? []
    return (
      <div className="grid gap-1.5">
        <Label htmlFor={field.id} className="text-sm font-medium">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Controller
          name={field.id}
          control={control}
          rules={validation}
          render={({ field: f }) => (
            <Select value={f.value ?? ''} onValueChange={f.onChange}>
              <SelectTrigger id={field.id}>
                <SelectValue placeholder="— Chọn —" />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    )
  }

  if (field.type === 'textarea') {
    return (
      <div className="grid gap-1.5">
        <Label htmlFor={field.id} className="text-sm font-medium">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Textarea
          id={field.id}
          placeholder={field.placeholder}
          rows={3}
          {...register(field.id, validation)}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    )
  }

  const inputType = field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={field.id} className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={field.id}
        type={inputType}
        placeholder={field.placeholder}
        {...register(field.id, validation)}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

interface PreviewProps {
  templateId: string
  fields: FieldConfig[]
  values: Record<string, string>
  pageCount: number
  pagesInfo: Array<{ page: number; widthPt: number; heightPt: number }>
  onBack: () => void
  onConfirm: () => void
  isSubmitting: boolean
}

function PreviewStep({ templateId, fields, values, pageCount, pagesInfo, onBack, onConfirm, isSubmitting }: PreviewProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const pageInfo = pagesInfo[currentPage - 1]

  return (
    <div className="flex flex-col">
      {/* Preview toolbar */}
      <div className="flex items-center gap-2 px-6 py-3 border-b bg-muted/30">
        <Button type="button" variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Chỉnh sửa lại
        </Button>
        <div className="flex items-center gap-1 mx-auto">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground px-1 tabular-nums">
            Trang {currentPage} / {pageCount}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={currentPage >= pageCount}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button type="button" size="sm" onClick={onConfirm} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Đang gửi...
            </>
          ) : (
            <>
              Xác nhận gửi
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </>
          )}
        </Button>
      </div>

      {/* PDF canvas with overlaid values */}
      <div className="flex-1 overflow-y-auto bg-muted/50 p-6">
        <div className="max-w-2xl mx-auto">
          {pageInfo && (
            <PdfPreviewCanvas
              templateId={templateId}
              currentPage={currentPage}
              pageInfo={pageInfo}
              fields={fields}
              values={values}
            />
          )}
        </div>
      </div>
    </div>
  )
}

type Step = 'fill' | 'preview'

export function FormRendererPage({
  id,
  acceptanceRequestId,
  constructionLogId,
}: FormRendererPageProps) {
  const [step, setStep] = useState<Step>('fill')
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({})
  const [submission, setSubmission] = useState<PdfSubmission | null>(null)

  const { data: template } = useQuery(pdfTemplateQueries.detail(id))
  const { data: userPrefill } = useQuery(pdfTemplateQueries.prefill())
  const { data: acceptancePrefill } = useQuery({
    ...pdfTemplateQueries.acceptancePrefill(acceptanceRequestId ?? ''),
    enabled: !!acceptanceRequestId,
  })
  const { data: diaryPrefill } = useQuery({
    ...pdfTemplateQueries.diaryPrefill(constructionLogId ?? ''),
    enabled: !!constructionLogId,
  })
  // Gộp các nguồn: hồ sơ người dùng + dữ liệu phiếu + dữ liệu nhật ký (nguồn nghiệp vụ
  // ghi đè hồ sơ nếu trùng key). Mỗi lần điền chỉ 1 trong phiếu/nhật ký có giá trị.
  const prefillData = useMemo(
    () => ({ ...(userPrefill ?? {}), ...(acceptancePrefill ?? {}), ...(diaryPrefill ?? {}) }),
    [userPrefill, acceptancePrefill, diaryPrefill],
  )

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Record<string, string>>()

  useEffect(() => {
    if (!prefillData || !template?.fieldSchema?.fields) return
    template.fieldSchema.fields.forEach((field) => {
      if (field.dataKey && prefillData[field.dataKey]) {
        setValue(field.id, prefillData[field.dataKey])
      }
    })
  }, [prefillData, template?.fieldSchema?.fields, setValue])

  const submitMutation = useMutation({
    mutationFn: (values: Record<string, string>) =>
      pdfTemplateApi.submitForm(id, values, acceptanceRequestId, constructionLogId),
    onSuccess: (data) => setSubmission(data),
    onError: () => toast.error('Gửi form thất bại. Vui lòng thử lại.'),
  })

  function handlePrefill() {
    if (!prefillData || !template?.fieldSchema?.fields) {
      toast.info('Không có dữ liệu hồ sơ để tự điền.')
      return
    }
    let count = 0
    template.fieldSchema.fields.forEach((field) => {
      if (field.dataKey && prefillData[field.dataKey]) {
        setValue(field.id, prefillData[field.dataKey])
        count++
      }
    })
    if (count > 0) toast.success(`Đã tự điền ${count} trường từ hồ sơ.`)
    else toast.info('Không có trường nào được liên kết với hồ sơ.')
  }

  function goToPreview(data: Record<string, string>) {
    setPreviewValues(data)
    setStep('preview')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (submission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-6">
        <div className="flex flex-col items-center gap-3 text-center max-w-md">
          <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
            <FileCheck className="h-7 w-7 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold">Form đã được gửi!</h2>
          <p className="text-sm text-muted-foreground">PDF của bạn đã được tạo thành công.</p>
        </div>
        <div className="flex gap-3">
          {submission.status === 'done' && (
            <Button asChild>
              <a href={pdfTemplateApi.submissionDownloadUrl(submission.id)} download>
                <Download className="mr-1.5 h-4 w-4" />
                Tải xuống PDF
              </a>
            </Button>
          )}
          {submission.status === 'failed' && (
            <p className="text-sm text-destructive">Lỗi: {submission.errorMessage}</p>
          )}
          <Button variant="outline" asChild>
            <Link href={ROUTES.pdfForms}>Về danh sách</Link>
          </Button>
        </div>
      </div>
    )
  }

  const sortedFields = [...(template?.fieldSchema?.fields ?? [])].sort((a, b) => {
    if (a.page !== b.page) return a.page - b.page
    return a.order - b.order
  })

  const pageCount = template?.pageCount ?? 1

  const pageGroups = sortedFields.reduce<Record<number, FieldConfig[]>>((acc, field) => {
    if (!acc[field.page]) acc[field.page] = []
    acc[field.page].push(field)
    return acc
  }, {})

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-6 py-4 border-b bg-background">
        <div className="flex flex-col min-w-0">
          <h1 className="font-semibold truncate">{template?.name ?? 'Biểu mẫu'}</h1>
          {step === 'preview' && (
            <p className="text-xs text-muted-foreground">Bước 2 / 2 — Xem trước</p>
          )}
        </div>
        {step === 'fill' && (
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={handlePrefill}>
              <Wand2 className="mr-1.5 h-3.5 w-3.5" />
              Tự điền
            </Button>
            <Button size="sm" onClick={handleSubmit(goToPreview)}>
              Xem trước
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Fill step */}
      {step === 'fill' && (
        <form onSubmit={handleSubmit(goToPreview)}>
          <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
            {sortedFields.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-12">
                Biểu mẫu chưa có trường nào.
              </p>
            )}
            {Object.entries(pageGroups).map(([page, pageFields]) => (
              <div key={page} className="space-y-5">
                {pageCount > 1 && (
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2">
                    Trang {page}
                  </p>
                )}
                {pageFields.map((field) => (
                  <FieldRow
                    key={field.id}
                    field={field}
                    register={register}
                    control={control}
                    error={errors[field.id]?.message as string | undefined}
                  />
                ))}
              </div>
            ))}
          </div>
        </form>
      )}

      {/* Preview step */}
      {step === 'preview' && (
        <PreviewStep
          templateId={id}
          fields={sortedFields}
          values={previewValues}
          pageCount={pageCount}
          pagesInfo={template?.pagesInfo ?? []}
          onBack={() => setStep('fill')}
          onConfirm={() => submitMutation.mutate(previewValues)}
          isSubmitting={submitMutation.isPending}
        />
      )}
    </>
  )
}
