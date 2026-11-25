"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Dự án đang chọn (global context) — state ở SHARED để mọi layer (features/pages)
 * đọc/ghi mà không vi phạm ranh giới FSD. Lưu localStorage để giữ qua reload.
 * UI chọn dự án + logic mặc-định-dự-án-đầu nằm ở `features/select-project`.
 */
interface SelectedProjectState {
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
}

export const SELECTED_PROJECT_STORAGE_KEY = "selected-project";

export const useSelectedProjectStore = create<SelectedProjectState>()(
  persist(
    (set) => ({
      selectedProjectId: null,
      setSelectedProjectId: (id) => set({ selectedProjectId: id }),
    }),
    { name: SELECTED_PROJECT_STORAGE_KEY },
  ),
);
