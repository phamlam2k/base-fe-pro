'use client'
import { create } from 'zustand'
import type { FieldConfig } from '@/entities/pdf-template'

interface BuilderState {
  fields: FieldConfig[]
  selectedFieldId: string | null
  currentPage: number
  isDirty: boolean
  setFields: (fields: FieldConfig[]) => void
  addField: (field: FieldConfig) => void
  updateField: (id: string, updates: Partial<FieldConfig>) => void
  removeField: (id: string) => void
  selectField: (id: string | null) => void
  setPage: (page: number) => void
  markClean: () => void
}

export const useBuilderStore = create<BuilderState>((set) => ({
  fields: [],
  selectedFieldId: null,
  currentPage: 1,
  isDirty: false,
  setFields: (fields) => set({ fields, isDirty: false }),
  addField: (field) => set((state) => ({
    fields: [...state.fields, field],
    selectedFieldId: field.id,
    isDirty: true,
  })),
  updateField: (id, updates) => set((state) => ({
    fields: state.fields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    isDirty: true,
  })),
  removeField: (id) => set((state) => ({
    fields: state.fields.filter((f) => f.id !== id),
    selectedFieldId: state.selectedFieldId === id ? null : state.selectedFieldId,
    isDirty: true,
  })),
  selectField: (id) => set({ selectedFieldId: id }),
  setPage: (page) => set({ currentPage: page }),
  markClean: () => set({ isDirty: false }),
}))
