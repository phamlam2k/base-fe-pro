"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * UI appearance preferences (color preset, corner radius, spacing density).
 * Dark/light mode itself is handled by next-themes; everything else lives
 * here and is applied as `data-*` attributes on <html>, which the CSS in
 * `globals.css` responds to.
 *
 * A tiny inline script in the root layout re-applies these attributes before
 * hydration to avoid a flash of the default theme.
 */

export const THEME_PRESETS = [
  "neutral",
  "blue",
  "violet",
  "green",
  "orange",
  "rose",
] as const;
export type ThemePreset = (typeof THEME_PRESETS)[number];

export const RADIUS_OPTIONS = ["none", "sm", "md", "lg", "xl"] as const;
export type RadiusOption = (typeof RADIUS_OPTIONS)[number];

export const DENSITY_OPTIONS = ["compact", "comfortable", "spacious"] as const;
export type DensityOption = (typeof DENSITY_OPTIONS)[number];

export interface Preferences {
  preset: ThemePreset;
  radius: RadiusOption;
  density: DensityOption;
}

export const DEFAULT_PREFERENCES: Preferences = {
  preset: "neutral",
  radius: "lg",
  density: "comfortable",
};

/** localStorage key — must match the inline no-flash script in layout.tsx. */
export const PREFERENCES_STORAGE_KEY = "ui-preferences";

export function applyPreferences(prefs: Preferences): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  const attrs: Array<[string, string, string]> = [
    ["data-preset", prefs.preset, DEFAULT_PREFERENCES.preset],
    ["data-radius", prefs.radius, DEFAULT_PREFERENCES.radius],
    ["data-density", prefs.density, DEFAULT_PREFERENCES.density],
  ];

  for (const [attr, value, defaultValue] of attrs) {
    if (value === defaultValue) root.removeAttribute(attr);
    else root.setAttribute(attr, value);
  }
}

interface PreferencesState extends Preferences {
  setPreset: (preset: ThemePreset) => void;
  setRadius: (radius: RadiusOption) => void;
  setDensity: (density: DensityOption) => void;
  reset: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => {
      const update = (partial: Partial<Preferences>) => {
        set(partial);
        const { preset, radius, density } = get();
        applyPreferences({ preset, radius, density });
      };

      return {
        ...DEFAULT_PREFERENCES,
        setPreset: (preset) => update({ preset }),
        setRadius: (radius) => update({ radius }),
        setDensity: (density) => update({ density }),
        reset: () => update({ ...DEFAULT_PREFERENCES }),
      };
    },
    {
      name: PREFERENCES_STORAGE_KEY,
      partialize: ({ preset, radius, density }) => ({
        preset,
        radius,
        density,
      }),
    },
  ),
);
