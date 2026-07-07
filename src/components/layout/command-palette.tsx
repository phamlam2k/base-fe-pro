"use client";

import * as React from "react";
import { Languages, LogOut, Moon, Search, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/shared/ui/command";
import { NAV_GROUPS } from "@/shared/config/nav";
import { setUserLocale } from "@/shared/config/i18n/actions";
import { useLogout } from "@/features/auth";
import { usePermission } from "@/entities/session";

/**
 * Global command palette (Ctrl/Cmd+K): permission-filtered navigation plus
 * quick actions. Mounted once in the protected layout.
 */
export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const t = useTranslations("commandPalette");
  const tNav = useTranslations("nav");
  const { can } = usePermission();
  const { setTheme } = useTheme();
  const logout = useLogout();

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((previous) => !previous);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  const navItems = NAV_GROUPS.flatMap((group) => group.items).filter(
    (item) => !item.permission || can(item.permission),
  );

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-muted-foreground hidden w-56 justify-start md:flex"
        onClick={() => setOpen(true)}
      >
        <Search />
        {t("placeholder")}
        <kbd className="bg-muted pointer-events-none ml-auto rounded px-1.5 font-mono text-[10px]">
          Ctrl K
        </kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={t("title")}
        description={t("placeholder")}
      >
        <CommandInput placeholder={t("placeholder")} />
        <CommandList>
          <CommandEmpty>{t("empty")}</CommandEmpty>

          <CommandGroup heading={t("navigation")}>
            {navItems.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => run(() => router.push(item.href))}
              >
                <item.icon />
                {tNav(item.titleKey)}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading={t("actions")}>
            <CommandItem onSelect={() => run(() => setTheme("light"))}>
              <Sun />
              {t("themeLight")}
            </CommandItem>
            <CommandItem onSelect={() => run(() => setTheme("dark"))}>
              <Moon />
              {t("themeDark")}
            </CommandItem>
            <CommandItem
              onSelect={() =>
                run(async () => {
                  await setUserLocale("vi");
                  router.refresh();
                })
              }
            >
              <Languages />
              {t("switchToVietnamese")}
            </CommandItem>
            <CommandItem
              onSelect={() =>
                run(async () => {
                  await setUserLocale("en");
                  router.refresh();
                })
              }
            >
              <Languages />
              {t("switchToEnglish")}
            </CommandItem>
            <CommandItem onSelect={() => run(() => logout.mutate())}>
              <LogOut />
              {tNav("logout")}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
