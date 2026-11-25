"use client";

import { CompaniesPanel } from "./companies-panel";

/**
 * Trang "Quản lý công ty" — chỉ SuperAdmin (app-role admin, có `companies:manage`).
 * Quản lý danh sách công ty + tạo/xem tài khoản Admin của từng công ty (ngay trong
 * CompaniesPanel). Tab "Thành viên" cũ đã bỏ (trùng với Quản lý người dùng); cây dự
 * án/nhóm ở trang riêng (ProjectConsole).
 */
export function OrganizationView() {
  return (
    <div className="grid gap-6">
      <CompaniesPanel />
    </div>
  );
}
