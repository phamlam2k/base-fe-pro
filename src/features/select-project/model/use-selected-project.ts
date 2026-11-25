"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { projectQueries } from "@/entities/project";
import { useSelectedProjectStore } from "./selected-project-store";

/**
 * Nạp danh sách dự án của user + quản lý dự án đang chọn:
 * - Mặc định = dự án đầu tiên nếu chưa chọn (hoặc lựa chọn cũ không còn hợp lệ).
 * - `isEmpty` = user chưa được thêm vào dự án nào.
 * - `selectedProjectId` trả về là giá trị ĐÃ HỢP LỆ hoá (thuộc danh sách).
 */
export function useSelectedProject() {
  const { data: projects = [], isLoading } = useQuery(projectQueries.myList());
  const stored = useSelectedProjectStore((s) => s.selectedProjectId);
  const setSelectedProjectId = useSelectedProjectStore((s) => s.setSelectedProjectId);

  const valid = projects.some((p) => p.id === stored);
  const effectiveId = valid ? stored : (projects[0]?.id ?? null);

  useEffect(() => {
    if (isLoading || projects.length === 0) return;
    if (!valid && effectiveId) setSelectedProjectId(effectiveId);
  }, [isLoading, projects.length, valid, effectiveId, setSelectedProjectId]);

  return {
    projects,
    selectedProjectId: effectiveId,
    setSelectedProjectId,
    isEmpty: !isLoading && projects.length === 0,
    isLoading,
  };
}
