// Store dự án đang chọn sống ở SHARED (mọi layer đọc được). File này re-export lại.
export {
  useSelectedProjectStore,
  SELECTED_PROJECT_STORAGE_KEY,
} from "@/shared/lib/selected-project";
