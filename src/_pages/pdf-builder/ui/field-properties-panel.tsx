'use client'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { Check, ChevronsUpDown, Trash2 } from 'lucide-react'
import {
  PREFILL_KEYS,
  PREFILL_USER_GROUP_LABEL,
  pdfTemplateQueries,
} from '@/entities/pdf-template'
import type { FieldConfig, FieldType, PrefillCatalogSection } from '@/entities/pdf-template'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { cn } from '@/shared/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { Switch } from '@/shared/ui/switch'
import { Separator } from '@/shared/ui/separator'

interface FieldFormValues {
  label: string
  type: FieldType
  required: boolean
  placeholder: string
  dataKey: string
  x: number
  y: number
  width: number
  height: number
  fontSize: number
}

function toFormValues(field: FieldConfig): FieldFormValues {
  return {
    label: field.label,
    type: field.type,
    required: field.required,
    placeholder: field.placeholder ?? '',
    dataKey: field.dataKey ?? '',
    x: Math.round(field.x),
    y: Math.round(field.y),
    width: Math.round(field.width),
    height: Math.round(field.height),
    fontSize: field.style?.fontSize ?? 11,
  }
}

interface FieldPropertiesPanelProps {
  field: FieldConfig
  onUpdate: (updates: Partial<FieldConfig>) => void
  onDelete: () => void
}

export function FieldPropertiesPanel({ field, onUpdate, onDelete }: FieldPropertiesPanelProps) {
  const { register, watch, setValue, getValues } = useForm<FieldFormValues>({
    defaultValues: toFormValues(field),
  })

  // Danh mục khoá tự-điền: nhóm "Hồ sơ người dùng" (tĩnh) + nhóm nghiệp vụ phiếu nghiệm thu
  // + nhóm nhật ký thi công (đều động từ backend). Mẫu dùng chung, nguồn chọn lúc điền.
  const { data: catalog } = useQuery(pdfTemplateQueries.prefillCatalog())
  const { data: diaryCatalog } = useQuery(pdfTemplateQueries.diaryPrefillCatalog())
  const prefillGroups: PrefillCatalogSection[] = [
    { group: PREFILL_USER_GROUP_LABEL, keys: PREFILL_KEYS },
    ...(catalog ?? []),
    ...(diaryCatalog ?? []),
  ]

  function commit() {
    const v = getValues()
    if (!v.label.trim()) return
    onUpdate({
      label: v.label,
      type: v.type,
      required: v.required,
      placeholder: v.placeholder || undefined,
      dataKey: v.dataKey || undefined,
      x: Number(v.x),
      y: Number(v.y),
      width: Number(v.width),
      height: Number(v.height),
      style: { ...field.style, fontSize: Number(v.fontSize) },
    })
  }

  const FIELD_TYPE_OPTIONS: Array<{ value: FieldType; label: string }> = [
    { value: 'text', label: 'Văn bản' },
    { value: 'textarea', label: 'Đoạn văn' },
    { value: 'number', label: 'Số' },
    { value: 'date', label: 'Ngày tháng' },
    { value: 'select', label: 'Danh sách chọn' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'signature', label: 'Chữ ký' },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Thuộc tính field</p>
        <Button variant="ghost" size="icon" onClick={onDelete} className="h-7 w-7 text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid gap-1.5">
        <Label className="text-xs">Nhãn <span className="text-destructive">*</span></Label>
        <Input
          className={cn('h-8 text-sm', !watch('label').trim() && 'border-destructive focus-visible:ring-destructive')}
          {...register('label')}
          onBlur={commit}
        />
        {!watch('label').trim() && (
          <p className="text-xs text-destructive">Nhãn không được để trống</p>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label className="text-xs">Loại input</Label>
        <Select
          value={watch('type')}
          onValueChange={(v) => { setValue('type', v as FieldType); commit() }}
        >
          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {FIELD_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label className="text-xs">Tự điền dữ liệu</Label>
        <DataKeyCombobox
          value={watch('dataKey') || ''}
          groups={prefillGroups}
          onChange={(v) => { setValue('dataKey', v); commit() }}
        />
      </div>

      <div className="grid gap-1.5">
        <Label className="text-xs">Placeholder</Label>
        <Input className="h-8 text-sm" {...register('placeholder')} onBlur={commit} />
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-xs">Bắt buộc</Label>
        <Switch
          checked={watch('required')}
          onCheckedChange={(v) => { setValue('required', v); commit() }}
        />
      </div>

      <Separator />

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Vị trí & kích thước (pt)</p>
        <div className="grid grid-cols-2 gap-2">
          {(['x', 'y', 'width', 'height'] as const).map((key) => (
            <div key={key} className="grid gap-1">
              <Label className="text-xs uppercase text-muted-foreground">{key}</Label>
              <Input type="number" className="h-7 text-xs" {...register(key, { valueAsNumber: true })} onBlur={commit} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label className="text-xs">Cỡ chữ (pt)</Label>
        <Input type="number" className="h-7 text-xs" {...register('fontSize', { valueAsNumber: true })} onBlur={commit} />
      </div>
    </div>
  )
}

/** Combobox có ô tìm kiếm để chọn khoá "Tự điền dữ liệu" (nhiều khoá → search cho nhanh). */
function DataKeyCombobox({
  value,
  groups,
  onChange,
}: {
  value: string
  groups: PrefillCatalogSection[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const selectedLabel = React.useMemo(() => {
    for (const g of groups) {
      const found = g.keys.find((k) => k.key === value)
      if (found) return found.label
    }
    return ''
  }, [groups, value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-8 justify-between text-sm font-normal"
        >
          <span className={cn('truncate', !selectedLabel && 'text-muted-foreground')}>
            {selectedLabel || '— Không —'}
          </span>
          <ChevronsUpDown className="ml-2 size-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Tìm khoá dữ liệu…" className="h-8" />
          <CommandList>
            <CommandEmpty>Không tìm thấy.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="— Không —"
                onSelect={() => { onChange(''); setOpen(false) }}
              >
                <Check className={cn('mr-2 size-3.5', !value ? 'opacity-100' : 'opacity-0')} />
                — Không —
              </CommandItem>
            </CommandGroup>
            {groups.map((section) => (
              <CommandGroup key={section.group} heading={section.group}>
                {section.keys.map((dk) => (
                  <CommandItem
                    key={dk.key}
                    value={`${dk.label} ${dk.key} ${section.group}`}
                    onSelect={() => { onChange(dk.key); setOpen(false) }}
                  >
                    <Check className={cn('mr-2 size-3.5', value === dk.key ? 'opacity-100' : 'opacity-0')} />
                    {dk.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
