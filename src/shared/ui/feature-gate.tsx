"use client";

import * as React from "react";

import { isFeatureEnabled, type FeatureFlag } from "@/shared/config/feature-flags";

export function useFeatureFlag(flag: FeatureFlag): boolean {
  return isFeatureEnabled(flag);
}

/** Renders children only when the feature flag is on. */
export function FeatureGate({
  flag,
  fallback = null,
  children,
}: {
  flag: FeatureFlag;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  return <>{isFeatureEnabled(flag) ? children : fallback}</>;
}
