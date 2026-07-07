import {
  FileText,
  LayoutDashboard,
  ListChecks,
  Palette,
  ShieldCheck,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { Permission } from "@/shared/config/permissions";
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
    titleKey: "management",
    items: [
      {
        titleKey: "organization",
        href: ROUTES.organization,
        icon: ShieldCheck,
        permission: "orgs:view",
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
];
