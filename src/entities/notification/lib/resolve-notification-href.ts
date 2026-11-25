import { ROUTES } from "@/shared/config/routes";

import type { Notification } from "@/entities/notification/model/notification";

/**
 * Registry điều hướng thông báo (kind-specific) cho WEB — nơi DUY NHẤT quyết định
 * "bấm thông báo loại X → mở trang nào". Thêm loại noti mới = thêm 1 dòng.
 * Trả về href, hoặc null nếu không deep-link được (thiếu target).
 */
type HrefBuilder = (id: string) => string;

// Trang đích theo kind. Tách theo kind để sau đổi đích 1 dòng (vd approved → biên bản).
const HREF_BY_KIND: Record<string, HrefBuilder> = {
  new_request: ROUTES.acceptanceRequestDetail,
  confirmed: ROUTES.acceptanceRequestDetail,
  supplement: ROUTES.acceptanceRequestDetail,
  approved: ROUTES.acceptanceRequestDetail,
  rejected: ROUTES.acceptanceRequestDetail,
  remediate: ROUTES.acceptanceRequestDetail,
  sampling_result: ROUTES.acceptanceRequestDetail,
  overdue: ROUTES.acceptanceRequestDetail,
  vetoed: ROUTES.acceptanceRequestDetail,
  log_submitted: ROUTES.constructionLogDetail,
  log_signed: ROUTES.constructionLogDetail,
  log_revision: ROUTES.constructionLogDetail,
};

// Fallback khi kind chưa có trong bảng: suy theo loại target.
const HREF_BY_TARGET_TYPE: Record<string, HrefBuilder> = {
  acceptance_request: ROUTES.acceptanceRequestDetail,
  construction_log: ROUTES.constructionLogDetail,
};

export function resolveNotificationHref(n: Notification): string | null {
  if (!n.target?.id) return null;
  const build = HREF_BY_KIND[n.kind] ?? HREF_BY_TARGET_TYPE[n.target.type];
  return build ? build(n.target.id) : null;
}
