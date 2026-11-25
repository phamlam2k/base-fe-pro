'use client'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { FieldConfig, PageInfo } from '@/entities/pdf-template'

interface FieldOverlayProps {
  field: FieldConfig
  pageInfo: PageInfo
  containerWidth: number
  isSelected: boolean
  onClick: () => void
}

export function FieldOverlay({ field, pageInfo, containerWidth, isSelected, onClick }: FieldOverlayProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `canvas-${field.id}`,
    data: { origin: 'canvas', fieldId: field.id, field },
  })

  const scale = containerWidth / pageInfo.widthPt
  const left = field.x * scale
  const top = (pageInfo.heightPt - field.y - field.height) * scale
  const width = field.width * scale
  const height = field.height * scale

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : isSelected ? 20 : 10,
        touchAction: 'none',
      }}
      {...listeners}
      {...attributes}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={`border-2 flex items-center px-1 overflow-hidden cursor-grab active:cursor-grabbing transition-colors ${
        isSelected
          ? 'border-blue-500 bg-blue-50/60 shadow-sm'
          : 'border-blue-300 bg-blue-50/30 hover:border-blue-400'
      } ${isDragging ? 'opacity-60' : ''}`}
    >
      <span className="text-[10px] text-blue-700 truncate leading-tight pointer-events-none font-medium">
        {field.label}
      </span>
    </div>
  )
}
