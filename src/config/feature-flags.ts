/**
 * Feature flags — static config for now, but every consumer goes through
 * `isFeatureEnabled()` / `useFeatureFlag()` / `<FeatureGate>`, so swapping in
 * a remote provider (LaunchDarkly, Unleash, GrowthBook...) later only
 * changes this file.
 */
export const FEATURE_FLAGS = {
  notifications: true,
  commandPalette: true,
  wizardExample: true,
  csvExport: true,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}
