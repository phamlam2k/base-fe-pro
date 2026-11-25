'use client'
import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Loader2, Pencil, Plus, Settings } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { pdfTemplateApi, pdfTemplateQueries } from '@/entities/pdf-template'
import type { PdfTemplate } from '@/entities/pdf-template'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

function UploadTemplateDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const uploadMutation = useMutation({
    mutationFn: () => {
      const file = fileRef.current?.files?.[0]
      if (!file) throw new Error('Vui lòng chọn file PDF')
      const fd = new FormData()
      fd.append('name', name)
      fd.append('description', description)
      fd.append('file', file)
      return pdfTemplateApi.upload(fd)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pdfTemplateQueries.lists() })
      toast.success('Đã tải lên template')
      setOpen(false)
      setName('')
      setDescription('')
      if (fileRef.current) fileRef.current.value = ''
    },
    onError: (err: Error) => toast.error(err.message || 'Tải lên thất bại'),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Upload Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload PDF Template</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Tên template</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên template..."
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Mô tả</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn gọn..."
            />
          </div>
          <div className="grid gap-1.5">
            <Label>File PDF</Label>
            <Input ref={fileRef} type="file" accept="application/pdf" />
          </div>
          <Button
            onClick={() => uploadMutation.mutate()}
            disabled={uploadMutation.isPending || !name}
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Đang tải lên...
              </>
            ) : (
              'Tải lên'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function EditTemplateDialog({ template }: { template: PdfTemplate }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(template.name)
  const [description, setDescription] = useState(template.description ?? '')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () =>
      pdfTemplateApi.updateInfo(template.id, {
        name: name.trim(),
        description: description.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pdfTemplateQueries.lists() })
      toast.success('Đã cập nhật biểu mẫu')
      setOpen(false)
    },
    onError: () => toast.error('Cập nhật thất bại'),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        // Mở lại → nạp giá trị hiện tại của mẫu.
        if (v) {
          setName(template.name)
          setDescription(template.description ?? '')
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-xs">
          <Pencil className="mr-1 h-3 w-3" />
          Sửa tên
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sửa biểu mẫu</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Tên biểu mẫu</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên biểu mẫu..."
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Mô tả</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn gọn..."
            />
          </div>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !name.trim()}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              'Lưu'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PublishButton({ template }: { template: PdfTemplate }) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: () =>
      pdfTemplateApi.setPublished(template.id, !template.isPublished),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pdfTemplateQueries.lists() })
      toast.success(template.isPublished ? 'Đã thu hồi' : 'Đã xuất bản')
    },
    onError: () => toast.error('Thao tác thất bại'),
  })
  return (
    <Button
      size="sm"
      variant={template.isPublished ? 'outline' : 'default'}
      className="h-7 text-xs"
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      {mutation.isPending ? (
        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
      ) : null}
      {template.isPublished ? 'Thu hồi' : 'Xuất bản'}
    </Button>
  )
}

export function PdfTemplatesPage() {
  const { data: templates = [], isLoading } = useQuery(pdfTemplateQueries.list())

  return (
    <div className="grid gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">PDF Templates</h1>
          <p className="text-sm text-muted-foreground">Quản lý các mẫu PDF và cấu hình field</p>
        </div>
        <UploadTemplateDialog />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && templates.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg">
          <FileText className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">Chưa có template nào</p>
          <p className="text-xs text-muted-foreground mt-1">Tải lên file PDF để bắt đầu</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="text-sm truncate">{template.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {template.companyName ?? 'Mẫu chung'}
                  </p>
                  {template.description && (
                    <CardDescription className="text-xs mt-0.5 line-clamp-2">
                      {template.description}
                    </CardDescription>
                  )}
                </div>
                <Badge variant={template.isPublished ? 'default' : 'secondary'} className="shrink-0 text-xs">
                  {template.isPublished ? 'Đã xuất bản' : 'Nháp'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {template.pageCount} trang
                  {template.fieldSchema && (
                    <> · {template.fieldSchema.fields.length} field</>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <EditTemplateDialog template={template} />
                  <PublishButton template={template} />
                  <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                    <Link href={`/pdf-builder/${template.id}`}>
                      <Settings className="mr-1 h-3 w-3" />
                      Builder
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
