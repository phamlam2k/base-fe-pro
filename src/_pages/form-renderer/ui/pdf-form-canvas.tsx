'use client'
import { useRef, useEffect, useState, useCallback } from 'react'
import type { Control, UseFormRegister } from 'react-hook-form'
import type { FieldConfig, PageInfo } from '@/entities/pdf-template'
import { FormFieldInput } from './form-field-input'

interface PdfFormCanvasProps {
  templateId: string
  currentPage: number
  pageInfo: PageInfo
  fields: FieldConfig[]
  register: UseFormRegister<Record<string, string>>
  control: Control<Record<string, string>>
  errors: Record<string, unknown>
}

export function PdfFormCanvas({ templateId, currentPage, pageInfo, fields, register, control, errors }: PdfFormCanvasProps) {
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
      {containerWidth > 0 &&
        fieldsOnPage.map((field) => (
          <FormFieldInput
            key={field.id}
            field={field}
            pageInfo={pageInfo}
            containerWidth={containerWidth}
            register={register}
            control={control}
            hasError={!!errors[field.id]}
          />
        ))}
    </div>
  )
}
