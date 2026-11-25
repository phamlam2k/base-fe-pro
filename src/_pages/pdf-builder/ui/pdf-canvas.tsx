'use client'
import { useDroppable } from '@dnd-kit/core'
import { useRef, useEffect, useState, useCallback } from 'react'
import type { FieldConfig, PageInfo } from '@/entities/pdf-template'
import { FieldOverlay } from './field-overlay'

interface PdfCanvasProps {
  templateId: string
  currentPage: number
  pageInfo: PageInfo
  fields: FieldConfig[]
  selectedFieldId: string | null
  onContainerWidthChange: (width: number) => void
  onFieldSelect: (id: string | null) => void
}

export function PdfCanvas({
  templateId,
  currentPage,
  pageInfo,
  fields,
  selectedFieldId,
  onContainerWidthChange,
  onFieldSelect,
}: PdfCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  const { setNodeRef } = useDroppable({ id: 'pdf-canvas' })

  // Stable combined ref: inline functions create a new reference every render,
  // causing @dnd-kit to receive setNodeRef(null) then setNodeRef(node) each cycle.
  // That briefly de-registers the droppable, making 'over' null mid-drag.
  const combinedRef = useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node)
      containerRef.current = node
    },
    [setNodeRef],
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width
      setContainerWidth(w)
      onContainerWidthChange(w)
    })
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const aspectRatio = pageInfo.widthPt > 0 ? pageInfo.heightPt / pageInfo.widthPt : 1.414

  const fieldsOnPage = fields.filter((f) => f.page === currentPage)

  return (
    <div
      ref={combinedRef}
      className="relative w-full bg-white shadow-xl select-none cursor-default"
      style={{ paddingBottom: `${aspectRatio * 100}%` }}
      onClick={() => onFieldSelect(null)}
    >
      {/* PDF page image */}
      <img
        src={`/api/pdf-templates/${templateId}/pages/${currentPage}`}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        alt={`Page ${currentPage}`}
        draggable={false}
      />

      {/* Field overlays */}
      {containerWidth > 0 &&
        fieldsOnPage.map((field) => (
          <FieldOverlay
            key={field.id}
            field={field}
            pageInfo={pageInfo}
            containerWidth={containerWidth}
            isSelected={field.id === selectedFieldId}
            onClick={() => onFieldSelect(field.id)}
          />
        ))}

      {/* Empty state hint */}
      {fieldsOnPage.length === 0 && containerWidth > 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-sm text-muted-foreground bg-white/80 px-4 py-2 rounded-md border border-dashed">
            Kéo loại field từ panel bên trái vào đây
          </p>
        </div>
      )}
    </div>
  )
}
