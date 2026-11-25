"use client";

import { useTranslations } from "next-intl";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { ThemeCustomizerControls } from "@/features/theme";

export function AppearanceSettings() {
  const t = useTranslations("settings");

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>{t("appearanceTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <ThemeCustomizerControls />
      </CardContent>
    </Card>
  );
}
