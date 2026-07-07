"use client";

import { Check, Paintbrush, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover";
import { cn } from "@/shared/lib/utils";
import {
  DENSITY_OPTIONS,
  RADIUS_OPTIONS,
  THEME_PRESETS,
  usePreferencesStore,
  type ThemePreset,
} from "@/features/theme/model/preferences-store";

/** Swatch colors shown in the picker (light-mode primary of each preset). */
const PRESET_SWATCHES: Record<ThemePreset, string> = {
  neutral: "oklch(0.205 0 0)",
  blue: "oklch(0.546 0.245 262.881)",
  violet: "oklch(0.541 0.281 293.009)",
  green: "oklch(0.627 0.194 149.214)",
  orange: "oklch(0.646 0.222 41.116)",
  rose: "oklch(0.586 0.253 17.585)",
};

/**
 * Controls for the runtime design tokens (color preset, radius, density).
 * Rendered inside the header popover and on the Settings → Appearance page.
 */
export function ThemeCustomizerControls() {
  const t = useTranslations("settings");
  const { preset, radius, density, setPreset, setRadius, setDensity, reset } =
    usePreferencesStore();

  return (
    <div className="grid gap-5">
      <div className="grid gap-2.5">
        <Label>{t("preset")}</Label>
        <div className="flex flex-wrap gap-2">
          {THEME_PRESETS.map((candidate) => (
            <button
              key={candidate}
              type="button"
              aria-label={candidate}
              aria-pressed={preset === candidate}
              onClick={() => setPreset(candidate)}
              className={cn(
                "flex size-8 items-center justify-center rounded-full border-2 transition-transform hover:scale-110",
                preset === candidate ? "border-foreground" : "border-transparent",
              )}
              style={{ backgroundColor: PRESET_SWATCHES[candidate] }}
            >
              {preset === candidate ? (
                <Check className="size-4 text-white" />
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2.5">
        <Label>{t("radius")}</Label>
        <div className="flex flex-wrap gap-2">
          {RADIUS_OPTIONS.map((candidate) => (
            <Button
              key={candidate}
              type="button"
              variant={radius === candidate ? "default" : "outline"}
              size="sm"
              onClick={() => setRadius(candidate)}
            >
              {candidate}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-2.5">
        <Label>{t("density")}</Label>
        <div className="flex flex-wrap gap-2">
          {DENSITY_OPTIONS.map((candidate) => (
            <Button
              key={candidate}
              type="button"
              variant={density === candidate ? "default" : "outline"}
              size="sm"
              onClick={() => setDensity(candidate)}
            >
              {t(candidate)}
            </Button>
          ))}
        </div>
      </div>

      <Button variant="ghost" size="sm" onClick={reset} className="justify-self-start">
        <RotateCcw />
        {t("resetDefaults")}
      </Button>
    </div>
  );
}

/** Header entry point: paintbrush icon opening the customizer. */
export function ThemeCustomizerPopover() {
  const t = useTranslations("settings");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("customize")}>
          <Paintbrush />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="mb-4 grid gap-1">
          <p className="font-medium">{t("customize")}</p>
          <p className="text-muted-foreground text-sm">
            {t("customizeDescription")}
          </p>
        </div>
        <ThemeCustomizerControls />
      </PopoverContent>
    </Popover>
  );
}
