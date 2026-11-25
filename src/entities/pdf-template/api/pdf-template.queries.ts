import { queryOptions } from '@tanstack/react-query'
import { pdfTemplateApi } from './pdf-template.api'

export const pdfTemplateQueries = {
  all: () => ['pdf-template'] as const,

  lists: () => [...pdfTemplateQueries.all(), 'list'] as const,
  list: () =>
    queryOptions({
      queryKey: pdfTemplateQueries.lists(),
      queryFn: () => pdfTemplateApi.list(),
    }),

  details: () => [...pdfTemplateQueries.all(), 'detail'] as const,
  detail: (id: string) =>
    queryOptions({
      queryKey: [...pdfTemplateQueries.details(), id],
      queryFn: () => pdfTemplateApi.get(id),
    }),

  schemas: () => [...pdfTemplateQueries.all(), 'schema'] as const,
  schema: (id: string) =>
    queryOptions({
      queryKey: [...pdfTemplateQueries.schemas(), id],
      queryFn: () => pdfTemplateApi.getSchema(id),
    }),

  prefill: () =>
    queryOptions({
      queryKey: [...pdfTemplateQueries.all(), 'prefill'],
      queryFn: () => pdfTemplateApi.getPrefillFields(),
    }),

  // MAD-27 — prefill theo ngữ cảnh 1 phiếu nghiệm thu.
  acceptancePrefill: (requestId: string) =>
    queryOptions({
      queryKey: [...pdfTemplateQueries.all(), 'acceptance-prefill', requestId],
      queryFn: () => pdfTemplateApi.getAcceptancePrefillFields(requestId),
    }),

  // Prefill theo ngữ cảnh 1 nhật ký thi công.
  diaryPrefill: (logId: string) =>
    queryOptions({
      queryKey: [...pdfTemplateQueries.all(), 'diary-prefill', logId],
      queryFn: () => pdfTemplateApi.getDiaryPrefillFields(logId),
    }),

  // MAD-27 — danh mục khoá nghiệp vụ cho dropdown builder.
  prefillCatalog: () =>
    queryOptions({
      queryKey: [...pdfTemplateQueries.all(), 'prefill-catalog'],
      queryFn: () => pdfTemplateApi.getPrefillCatalog(),
    }),

  // Danh mục khoá nhật ký cho dropdown builder.
  diaryPrefillCatalog: () =>
    queryOptions({
      queryKey: [...pdfTemplateQueries.all(), 'diary-prefill-catalog'],
      queryFn: () => pdfTemplateApi.getDiaryPrefillCatalog(),
    }),
}
