'use client'
import { useDraggable } from '@dnd-kit/core'
import { CalendarIcon, ChevronDown, Hash, PenLine, Square, Type } from 'lucide-react'
import type { FieldType } from '@/entities/pdf-template'

const PALETTE_ITEMS: Array<{ type: FieldType; label: string; Icon: React.ElementType }> = [
  { type: 'text', label: 'Văn bản', Icon: Type },
  { type: 'textarea', label: 'Đoạn văn', Icon: Type },
  { type: 'number', label: 'Số', Icon: Hash },
  { type: 'date', label: 'Ngày tháng', Icon: CalendarIcon },
  { type: 'select', label: 'Danh sách', Icon: ChevronDown },
  { type: 'checkbox', label: 'Checkbox', Icon: Square },
  { type: 'signature', label: 'Chữ ký', Icon: PenLine },
]

function PaletteItem({ type, label, Icon }: typeof PALETTE_ITEMS[number]) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { origin: 'palette', type },
  })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm cursor-grab select-none hover:bg-accent transition-colors ${isDragging ? 'opacity-40' : ''}`}
    >
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span>{label}</span>
    </div>
  )
}

export function FieldPalette() {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-1">
        Kéo vào PDF
      </p>
      {PALETTE_ITEMS.map((item) => (
        <PaletteItem key={item.type} {...item} />
      ))}
    </div>
  )
}
