'use client'
import type { CSSProperties } from 'react'
import type { Control, UseFormRegister } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import type { FieldConfig, PageInfo } from '@/entities/pdf-template'

interface FormFieldInputProps {
  field: FieldConfig
  pageInfo: PageInfo
  containerWidth: number
  register: UseFormRegister<Record<string, string>>
  control: Control<Record<string, string>>
  hasError: boolean
}

export function FormFieldInput({ field, pageInfo, containerWidth, register, control, hasError }: FormFieldInputProps) {
  const scale = containerWidth / pageInfo.widthPt
  const left = field.x * scale
  const top = (pageInfo.heightPt - field.y - field.height) * scale
  const width = field.width * scale
  const height = field.height * scale
  const fontSize = Math.max(9, (field.style?.fontSize ?? 11) * scale)

  const baseStyle: CSSProperties = {
    position: 'absolute',
    left,
    top,
    width,
    height,
    fontSize,
    fontFamily: 'inherit',
    background: hasError ? 'rgba(254, 202, 202, 0.4)' : 'rgba(219, 234, 254, 0.25)',
    border: hasError
      ? '1px solid rgba(239, 68, 68, 0.6)'
      : '1px solid rgba(96, 165, 250, 0.5)',
    borderRadius: 2,
    padding: '0 2px',
    color: field.style?.color ?? '#000',
    textAlign: (field.style?.textAlign as CSSProperties['textAlign']) ?? 'left',
    boxSizing: 'border-box',
    outline: 'none',
  }

  if (field.type === 'checkbox') {
    const size = Math.min(width, height) * 0.8
    return (
      <div style={{ ...baseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none' }}>
        <Controller
          name={field.id}
          control={control}
          render={({ field: f }) => (
            <input
              type="checkbox"
              style={{ width: size, height: size, cursor: 'pointer' }}
              checked={f.value === 'true'}
              onChange={(e) => f.onChange(e.target.checked ? 'true' : 'false')}
            />
          )}
        />
      </div>
    )
  }

  // Chữ ký dạng chữ dùng chung ô nhập nhiều dòng với textarea.
  if (field.type === 'textarea' || field.type === 'signature') {
    return (
      <textarea
        style={{ ...baseStyle, resize: 'none', lineHeight: '1.3', overflow: 'hidden', paddingTop: 1 }}
        placeholder={field.placeholder}
        {...register(field.id, { required: field.required })}
      />
    )
  }

  if (field.type === 'select') {
    const options = field.validation?.options ?? []
    return (
      <select
        style={{ ...baseStyle, cursor: 'pointer' }}
        {...register(field.id, { required: field.required })}
      >
        <option value="">— Chọn —</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    )
  }

  const inputType = field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'

  return (
    <input
      type={inputType}
      style={baseStyle}
      placeholder={field.placeholder}
      {...register(field.id, { required: field.required })}
    />
  )
}
