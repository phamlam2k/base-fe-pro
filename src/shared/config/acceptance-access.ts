import type { Role } from "@/shared/config/permissions";

/**
 * Ma trận VIEW màn nghiệm thu theo vai trò nghiệp vụ Madoka (MAD-4 slice).
 * Backend đã chặn dữ liệu + hành động; đây là lớp ẩn/hiện màn & nút trên UI.
 *
 * Vai trò Madoka: admin | investor (CĐT) | supervisor (TVGS) | contractor (NT) | lab (PTN).
 */
export const ACCEPTANCE_ACCESS = {
  overview: ["admin", "investor", "supervisor", "contractor", "lab"],
  // PTN (lab) cần vào danh sách phiếu để XÁC NHẬN yêu cầu (phiếu Cần thí nghiệm).
  // Backend đã scope: PTN chỉ thấy phiếu giao cho team thí nghiệm của mình.
  requests: ["admin", "investor", "supervisor", "contractor", "lab"],
  // CHỈ Nhà thầu (contractor) mới tạo phiếu — TVGS/PTN/CĐT/SuperAdmin đều KHÔNG.
  create: ["contractor"],
  records: ["admin", "investor", "supervisor", "contractor"],
  inspect: ["admin", "supervisor"], // xác nhận / từ chối / nghiệm thu hiện trường
} as const;

export type AcceptanceScreen = keyof typeof ACCEPTANCE_ACCESS;

/**
 * SuperAdmin (appRole "admin") luôn xem được mọi màn. Ngược lại xét theo
 * vai trò Madoka. Vai trò rỗng ("") → không có quyền nghiệp vụ (cần Admin gán).
 */
export function canAccessAcceptance(
  appRole: Role,
  madokaRole: string | undefined,
  screen: AcceptanceScreen,
): boolean {
  // Màn TẠO phiếu: chỉ Nhà thầu, KHÔNG ưu tiên SuperAdmin.
  if (screen === "create") return madokaRole === "contractor";
  if (appRole === "admin") return true;
  return (ACCEPTANCE_ACCESS[screen] as readonly string[]).includes(
    madokaRole ?? "",
  );
}
