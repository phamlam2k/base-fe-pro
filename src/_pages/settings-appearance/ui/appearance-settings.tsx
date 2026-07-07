"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
import { Separator } from "@/shared/ui/separator";
import { ThemeCustomizerControls } from "@/features/theme";

const MODES = [
  { value: "light", icon: Sun, labelKey: "light" },
  { value: "dark", icon: Moon, labelKey: "dark" },
  { value: "system", icon: Monitor, labelKey: "system" },
] as const;

export function AppearanceSettings() {
  const t = useTranslations("settings");
  const { theme, setTheme } = useTheme();

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>{t("appearanceTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-2.5">
          <Label>{t("mode")}</Label>
          <div className="flex flex-wrap gap-2">
            {MODES.map((mode) => (
              <Button
                key={mode.value}
                type="button"
                variant={theme === mode.value ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme(mode.value)}
              >
                <mode.icon />
                {t(mode.labelKey)}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        <ThemeCustomizerControls />
      </CardContent>
    </Card>
  );
}
