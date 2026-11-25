'use client'
import { useRef, useEffect, useState, useCallback } from 'react'
import type { CSSProperties } from 'react'
import type { FieldConfig, PageInfo } from '@/entities/pdf-template'

function formatValue(field: FieldConfig, value: string | undefined): string {
  if (field.type === 'checkbox') return value === 'true' ? '✓' : ''
  if (!value) return ''
  if (field.type === 'date') {
    const [y, m, d] = value.split('-')
    if (y && m && d) return `${d}/${m}/${y}`
  }
  return value
}

interface PdfPreviewCanvasProps {
  templateId: string
  currentPage: number
  pageInfo: PageInfo
  fields: FieldConfig[]
  values: Record<string, string>
}

export function PdfPreviewCanvas({ templateId, currentPage, pageInfo, fields, values }: PdfPreviewCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  const setRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const aspectRatio = pageInfo.widthPt > 0 ? pageInfo.heightPt / pageInfo.widthPt : 1.414
  const scale = containerWidth > 0 ? containerWidth / pageInfo.widthPt : 0
  const fieldsOnPage = fields.filter((f) => f.page === currentPage)

  return (
    <div
      ref={setRef}
      className="relative w-full bg-white shadow-xl select-none"
      style={{ paddingBottom: `${aspectRatio * 100}%` }}
    >
      <img
        src={`/api/pdf-templates/${templateId}/pages/${currentPage}`}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        alt={`Page ${currentPage}`}
        draggable={false}
      />

      {scale > 0 &&
        fieldsOnPage.map((field) => {
          const display = formatValue(field, values[field.id])
          if (!display) return null

          const left = field.x * scale
          const top = (pageInfo.heightPt - field.y - field.height) * scale
          const width = field.width * scale
          const height = field.height * scale
          const fontSize = Math.max(8, (field.style?.fontSize ?? 11) * scale)

          // Đa dòng khi type là textarea/signature, HOẶC giá trị có sẵn ký tự xuống
          // dòng (vd signedStatement "Đã ký…\n<tên TVGS>") dù field để type text.
          const isMultiline =
            field.type === 'textarea' || field.type === 'signature' || display.includes('\n')
          const isCheckbox = field.type === 'checkbox'

          const style: CSSProperties = {
            position: 'absolute',
            left,
            top,
            width,
            height,
            fontSize,
            lineHeight: isMultiline ? '1.3' : 'normal',
            color: field.style?.color ?? '#000',
            textAlign: (field.style?.textAlign as CSSProperties['textAlign']) ?? 'left',
            paddingLeft: 2,
            paddingRight: 2,
            paddingTop: isMultiline ? 2 : 0,
            overflow: 'hidden',
            whiteSpace: isMultiline ? 'pre-wrap' : 'nowrap',
            display: 'flex',
            alignItems: isCheckbox || !isMultiline ? 'center' : 'flex-start',
            justifyContent: isCheckbox ? 'center' : undefined,
            boxSizing: 'border-box',
          }

          return (
            <div key={field.id} style={style}>
              {display}
            </div>
          )
        })}
    </div>
  )
}
