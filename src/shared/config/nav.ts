import {
  ClipboardCheck,
  FileText,
  FolderTree,
  LayoutDashboard,
  ListChecks,
  Palette,
  ShieldCheck,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { Permission } from "@/shared/config/permissions";
import type { AcceptanceScreen } from "@/shared/config/acceptance-access";
import { ROUTES } from "@/shared/config/routes";

/**
 * Sidebar navigation config. `titleKey` maps into the `nav` namespace of the
 * i18n messages. Items with a `permission` are hidden from roles lacking it
 * (the route itself is additionally enforced by proxy.ts).
 */
export interface NavItem {
  titleKey: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
  /** Gating theo vai trò Madoka cho màn nghiệp vụ (MAD-4). */
  acceptanceKey?: AcceptanceScreen;
  /**
   * Chỉ hiện với người xem được "Quản lý dự án": admin/manager (quản trị) hoặc
   * Chủ đầu tư (madokaRole investor) — dùng canViewProjects() ở sidebar.
   */
  projectAccess?: boolean;
}

export interface NavGroup {
  titleKey: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    titleKey: "overview",
    items: [
      {
        titleKey: "dashboard",
        href: ROUTES.dashboard,
        icon: LayoutDashboard,
        permission: "dashboard:view",
      },
    ],
  },
  {
    titleKey: "madoka",
    items: [
      {
        titleKey: "overview",
        href: ROUTES.overview,
        icon: LayoutDashboard,
        permission: "acceptance:view",
        acceptanceKey: "overview",
      },
      {
        titleKey: "acceptanceRequests",
        href: ROUTES.acceptanceRequests,
        icon: ClipboardCheck,
        permission: "acceptance:view",
        acceptanceKey: "requests",
      },
      {
        titleKey: "constructionLogs",
        href: ROUTES.constructionLogs,
        icon: ListChecks,
        permission: "acceptance:view",
        acceptanceKey: "requests",
      },
      {
        titleKey: "acceptanceRecords",
        href: ROUTES.acceptanceRecords,
        icon: FileText,
        permission: "acceptance:view",
        acceptanceKey: "records",
      },
    ],
  },
  {
    titleKey: "management",
    items: [
      {
        titleKey: "organization",
        href: ROUTES.organization,
        icon: ShieldCheck,
        permission: "orgs:view",
      },
      {
        titleKey: "projectManagement",
        href: ROUTES.projectManagement,
        icon: FolderTree,
        projectAccess: true,
      },
      {
        titleKey: "users",
        href: ROUTES.users,
        icon: Users,
        permission: "users:view",
      },
    ],
  },
  // {
  //   titleKey: "examples",
  //   items: [
  //     {
  //       titleKey: "formExample",
  //       href: ROUTES.formExample,
  //       icon: FileText,
  //     },
  //     {
  //       titleKey: "wizardExample",
  //       href: ROUTES.wizardExample,
  //       icon: ListChecks,
  //     },
  //   ],
  // },
  {
    titleKey: "settings",
    items: [
      {
        titleKey: "appearance",
        href: ROUTES.settingsAppearance,
        icon: Palette,
        permission: "settings:view",
      },
      {
        titleKey: "profile",
        href: ROUTES.settingsProfile,
        icon: UserCircle,
        permission: "settings:view",
      },
    ],
  },
  {
    titleKey: "pdfForms",
    items: [
      {
        titleKey: "pdfFormFill",
        href: ROUTES.pdfForms,
        icon: FileText,
        permission: "acceptance:view",
      },
      {
        titleKey: "pdfTemplates",
        href: ROUTES.pdfTemplates,
        icon: FileText,
        permission: "pdf-forms:manage",
      },
      {
        titleKey: "pdfTemplateMapping",
        href: ROUTES.pdfTemplateMapping,
        icon: FileText,
        permission: "pdf-forms:manage",
      },
    ],
  },
];
