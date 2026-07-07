"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { Separator } from "@/shared/ui/separator";
import { SidebarTrigger } from "@/shared/ui/sidebar";
import { CommandPalette } from "./command-palette";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeCustomizerPopover } from "@/features/theme";
import { ThemeToggle } from "@/features/theme";
import { UserNav } from "./user-nav";
import { FeatureGate } from "@/shared/ui/feature-gate";
import { NAV_GROUPS } from "@/shared/config/nav";
import { NotificationsBell } from "@/features/notifications";

export function AppHeader() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const activeItem = NAV_GROUPS.flatMap((group) => group.items).find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return (
    <header className="bg-background/80 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <span className="text-sm font-medium">
        {activeItem ? t(activeItem.titleKey) : null}
      </span>

      <div className="ml-auto flex items-center gap-1">
        <FeatureGate flag="commandPalette">
          <CommandPalette />
        </FeatureGate>
        <FeatureGate flag="notifications">
          <NotificationsBell />
        </FeatureGate>
        <ThemeCustomizerPopover />
        <ThemeToggle />
        <LocaleSwitcher />
        <UserNav />
      </div>
    </header>
  );
}
