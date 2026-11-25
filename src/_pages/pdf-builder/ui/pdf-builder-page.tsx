'use client'
import { useEffect, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import {
  DEFAULT_FIELD_SIZES,
  FIELD_TYPE_LABELS,
  pdfTemplateApi,
  pdfTemplateQueries,
} from '@/entities/pdf-template'
import type { FieldConfig, FieldType } from '@/entities/pdf-template'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'
import { useBuilderStore } from '../model/builder-store'
import { FieldPalette } from './field-palette'
import { FieldPropertiesPanel } from './field-properties-panel'
import { PdfCanvas } from './pdf-canvas'

interface PdfBuilderPageProps {
  id: string
}

export function PdfBuilderPage({ id }: PdfBuilderPageProps) {
  const {
    fields,
    selectedFieldId,
    currentPage,
    isDirty,
    setFields,
    addField,
    updateField,
    removeField,
    selectField,
    setPage,
    markClean,
  } = useBuilderStore()

  const [containerWidth, setContainerWidth] = useState(0)
  const initialPointer = useRef<{ x: number; y: number } | null>(null)

  // Tracks the palette field type being dragged, used to render the DragOverlay preview.
  const [activePaletteType, setActivePaletteType] = useState<FieldType | null>(null)

  const { data: template } = useQuery(pdfTemplateQueries.detail(id))

  const queryClient = useQueryClient()
  const saveMutation = useMutation({
    mutationFn: () => pdfTemplateApi.saveSchema(id, fields),
    onSuccess: () => {
      markClean()
      queryClient.invalidateQueries({ queryKey: pdfTemplateQueries.schemas() })
      toast.success('Đã lưu schema')
    },
    onError: () => toast.error('Lưu thất bại'),
  })

  // Store Zustand là singleton module-level, giữ state qua các lần điều hướng route.
  const loadedTemplateId = useRef<string | null>(null)

  // Đổi mẫu → DỌN store NGAY (fields/trang/chọn) để KHÔNG rò field của mẫu trước sang
  // mẫu mới trong lúc chờ load (và mẫu mới có thể chưa có schema).
  useEffect(() => {
    setFields([])
    setPage(1)
    selectField(null)
    loadedTemplateId.current = null
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Nạp field của ĐÚNG mẫu 1 lần khi template load xong — kể cả mẫu CHƯA có schema
  // (nạp [] thay vì giữ field cũ). Không đè khi refetch/đang sửa (ref chặn nạp lại).
  useEffect(() => {
    if (template && loadedTemplateId.current !== id) {
      setFields(template.fieldSchema?.fields ?? [])
      loadedTemplateId.current = id
    }
  }, [template, id, setFields])

  // activationConstraint: drag chỉ activate sau khi di chuyển ≥5px.
  // Không có constraint → @dnd-kit chặn click event (preventDefault trên capture phase).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  function handleDragStart(event: DragStartEvent) {
    const activator = event.activatorEvent as PointerEvent
    initialPointer.current = { x: activator.clientX, y: activator.clientY }

    const data = event.active.data.current as { origin: string; type?: FieldType }
    if (data.origin === 'palette' && data.type) {
      setActivePaletteType(data.type)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActivePaletteType(null)

    const { active, over, delta } = event
    const data = active.data.current as { origin: string; type?: FieldType; fieldId?: string; field?: FieldConfig }

    if (!data) return

    if (data.origin === 'palette') {
      if (!over || over.id !== 'pdf-canvas') return
      if (!initialPointer.current) return

      // Use over.rect (the rect @dnd-kit actually measured for collision detection) instead
      // of a separate canvasContainerRef. This eliminates any mismatch between the ref's
      // DOM node and the actual droppable boundary, which caused the field to land at the
      // bottom of the page when the canvas had scrolled or been re-rendered.
      const canvasRect = over.rect
      const dropX = initialPointer.current.x + delta.x - canvasRect.left
      const dropY = initialPointer.current.y + delta.y - canvasRect.top

      const pageInfo = template?.pagesInfo[currentPage - 1]
      if (!pageInfo) return
      const scale = containerWidth / pageInfo.widthPt
      if (scale <= 0) return

      const fieldType = data.type!
      const fieldSize = DEFAULT_FIELD_SIZES[fieldType]
      const pdfX = Math.max(0, dropX / scale)
      const pdfY = Math.max(0, pageInfo.heightPt - dropY / scale - fieldSize.height)

      const newField: FieldConfig = {
        id: crypto.randomUUID(),
        label: FIELD_TYPE_LABELS[fieldType],
        type: fieldType,
        page: currentPage,
        x: pdfX,
        y: pdfY,
        width: fieldSize.width,
        height: fieldSize.height,
        required: false,
        order: fields.length,
        validation: {},
        style: { fontSize: 11, textAlign: 'left', color: '#000000' },
      }
      addField(newField)
    } else if (data.origin === 'canvas') {
      const fieldId = data.fieldId!
      const field = fields.find((f) => f.id === fieldId)
      if (!field) return
      const pageInfo = template?.pagesInfo[field.page - 1]
      if (!pageInfo) return
      const scale = containerWidth / pageInfo.widthPt
      updateField(fieldId, {
        x: Math.max(0, field.x + delta.x / scale),
        y: Math.max(0, field.y - delta.y / scale),
      })
    }
  }

  const pageInfo = template?.pagesInfo[currentPage - 1]
  const selectedField = fields.find((f) => f.id === selectedFieldId) ?? null

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center gap-4 px-4 py-3 border-b bg-background shrink-0">
          <h1 className="font-semibold text-sm">{template?.name}</h1>
          <div className="flex items-center gap-2 ml-auto">
            {/* Page navigator */}
            <Button
              variant="ghost"
              size="icon"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Trang {currentPage} / {template?.pageCount ?? 1}
            </span>
            <Button
              variant="ghost"
              size="icon"
              disabled={currentPage >= (template?.pageCount ?? 1)}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {/* Save */}
            <Button
              size="sm"
              disabled={!isDirty || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              className={cn(isDirty && 'ring-2 ring-orange-400')}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  Đang lưu
                </>
              ) : (
                <>
                  <Save className="mr-1 h-3.5 w-3.5" />
                  Lưu Schema
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 3-panel body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left palette */}
          <div className="w-52 shrink-0 border-r p-3 overflow-y-auto bg-muted/20">
            <FieldPalette />
          </div>

          {/* Center canvas */}
          <div className="flex-1 overflow-y-auto bg-muted/50 p-6">
            <div className="max-w-2xl mx-auto">
              {pageInfo && (
                <PdfCanvas
                  templateId={id}
                  currentPage={currentPage}
                  pageInfo={pageInfo}
                  fields={fields}
                  selectedFieldId={selectedFieldId}
                  onContainerWidthChange={setContainerWidth}
                  onFieldSelect={selectField}
                />
              )}
            </div>
          </div>

          {/* Right properties */}
          <div className="w-64 shrink-0 border-l p-3 overflow-y-auto bg-background">
            {selectedField ? (
              <FieldPropertiesPanel
                key={selectedFieldId}
                field={selectedField}
                onUpdate={(updates) => updateField(selectedFieldId!, updates)}
                onDelete={() => removeField(selectedFieldId!)}
              />
            ) : (
              <p className="text-xs text-muted-foreground text-center mt-8">
                Chọn một field trên canvas để chỉnh sửa
              </p>
            )}
          </div>
        </div>
      </div>

      {/* DragOverlay: follows the cursor while dragging from the palette */}
      <DragOverlay dropAnimation={null}>
        {activePaletteType && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-white shadow-lg text-sm font-medium text-blue-700 border-blue-300 whitespace-nowrap cursor-grabbing select-none pointer-events-none">
            <span>+</span>
            <span>{FIELD_TYPE_LABELS[activePaletteType]}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
