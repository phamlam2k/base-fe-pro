'use client'
import { useQuery } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import Link from 'next/link'
import { pdfTemplateQueries } from '@/entities/pdf-template'
import { ROUTES } from '@/shared/config/routes'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'

export function PdfFormsPage() {
  const { data: templates = [], isLoading } = useQuery(pdfTemplateQueries.list())

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Đang tải...</div>
  if (templates.length === 0) return (
    <div className="p-6 text-sm text-muted-foreground">Chưa có biểu mẫu nào.</div>
  )

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold mb-4">Biểu mẫu PDF</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <Card key={template.id} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <CardTitle className="text-sm">{template.name}</CardTitle>
                  {template.description && (
                    <CardDescription className="text-xs mt-1 line-clamp-2">{template.description}</CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="mt-auto pt-0">
              <p className="text-xs text-muted-foreground mb-3">{template.pageCount} trang</p>
              <Button asChild size="sm" className="w-full">
                <Link href={ROUTES.pdfFormFill(template.id)}>Điền form</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
