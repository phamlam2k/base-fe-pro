"use client";

import { CompanyContext, useCompanyPicker } from "./company-context";
import { StructurePanel } from "./structure-panel";

/**
 * Console "Quản lý dự án" — tách khỏi trang Phân quyền. Bộ chọn công ty +
 * cây dự án/nhóm (StructurePanel). Dữ liệu scope theo công ty người dùng thuộc
 * về; tạo/sửa/xoá vẫn gated ở PermissionGate bên trong StructurePanel.
 */
export function ProjectConsole() {
  const picker = useCompanyPicker();

  return (
    <div className="grid gap-4">
      <CompanyContext {...picker} />
      {picker.companyId ? <StructurePanel companyId={picker.companyId} /> : null}
    </div>
  );
}
