import type { Permission, Role } from "@/shared/config/permissions";

/**
 * Centralized route paths. Never hardcode a path string in a component —
 * import from here so renames stay one-line changes.
 */
export const ROUTES = {
  home: "/",
  login: "/login",
  changePassword: "/change-password",
  forbidden: "/403",
  dashboard: "/dashboard",
  users: "/users",
  organization: "/organization",
  projectManagement: "/project-management",
  overview: "/overview",
  acceptanceRequests: "/acceptance-requests",
  acceptanceRequestNew: "/acceptance-requests/new",
  acceptanceRequestDetail: (id: string) => `/acceptance-requests/${id}`,
  acceptanceRecords: "/acceptance-records",
  acceptanceRecordDetail: (id: string) => `/acceptance-records/${id}`,
  constructionLogs: "/construction-logs",
  constructionLogNew: "/construction-logs/new",
  constructionLogDetail: (id: string) => `/construction-logs/${id}`,
  formExample: "/examples/form",
  wizardExample: "/examples/wizard",
  settingsAppearance: "/settings/appearance",
  settingsProfile: "/settings/profile",
  projectZone: (id: string) => `/projects/${id}/zone`,
  pdfTemplates: "/pdf-templates",
  pdfTemplateMapping: "/pdf-template-mapping",
  pdfBuilder: (id: string) => `/pdf-builder/${id}`,
  pdfForms: "/pdf-forms",
  pdfFormFill: (id: string) => `/pdf-forms/${id}/fill`,
} as const;

/** Route prefix used for permission matching (see ROUTE_PERMISSIONS). */
export const PROJECTS_PREFIX = "/projects";

/** Routes reachable without a session. */
export const PUBLIC_ROUTES: readonly string[] = [ROUTES.login];

/**
 * Route-level permission requirements, enforced in `src/proxy.ts`.
 * Matching is prefix-based: "/users" also covers "/users/123".
 */
export const ROUTE_PERMISSIONS: ReadonlyArray<{
  prefix: string;
  permission: Permission;
}> = [
  { prefix: ROUTES.users, permission: "users:view" },
  { prefix: ROUTES.organization, permission: "orgs:view" },
  // ROUTES.projectManagement được gate riêng trong proxy.ts (cần madokaRole
  // để cho Chủ đầu tư — investor — vào), nên không khai báo ở đây.
  { prefix: ROUTES.overview, permission: "acceptance:view" },
  { prefix: ROUTES.acceptanceRequests, permission: "acceptance:view" },
  { prefix: ROUTES.acceptanceRecords, permission: "acceptance:view" },
  { prefix: ROUTES.constructionLogs, permission: "acceptance:view" },
  { prefix: PROJECTS_PREFIX, permission: "projects:manage-zone" },
  { prefix: ROUTES.dashboard, permission: "dashboard:view" },
  { prefix: "/pdf-builder", permission: "pdf-forms:manage" as Permission },
  { prefix: ROUTES.pdfTemplateMapping, permission: "pdf-forms:manage" as Permission },
  { prefix: "/pdf-templates", permission: "pdf-forms:manage" as Permission },
  // Trình điền biểu mẫu — SuperAdmin (không có acceptance:view) không vào được.
  { prefix: ROUTES.pdfForms, permission: "acceptance:view" },
];

/**
 * Trang mặc định sau đăng nhập theo vai trò. SuperAdmin (admin) không có Dashboard
 * (đã ẩn) → đưa về trang Quản lý công ty; còn lại về Dashboard.
 */
export function defaultLandingFor(role: Role): string {
  return role === "admin" ? ROUTES.organization : ROUTES.dashboard;
}

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function requiredPermissionFor(pathname: string): Permission | null {
  const match = ROUTE_PERMISSIONS.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return match?.permission ?? null;
}
