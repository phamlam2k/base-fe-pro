import type { Paginated } from "@/shared/api/types";

/** Shape trả về từ DRF PageNumberPagination (hoặc mảng thuần nếu tắt phân trang). */
export type DrfList<T> =
  | T[]
  | { results?: T[]; count?: number; next?: string | null };

/**
 * Chuyển response DRF (`{count, next, results}`) sang envelope `Paginated<T>`
 * dùng chung cho web (items + page/pageSize/total/totalPages). Chịu được cả
 * trường hợp backend trả mảng thuần (tắt phân trang).
 */
export function paginateFromDrf<T>(
  data: DrfList<T> | undefined,
  page: number,
  pageSize: number,
): Paginated<T> {
  const items = Array.isArray(data) ? data : (data?.results ?? []);
  const total = Array.isArray(data) ? items.length : (data?.count ?? items.length);
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  return { items, page, pageSize, total, totalPages };
}
