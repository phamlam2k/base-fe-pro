"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/shared/ui/skeleton";

/**
 * Client-only mount for the map editor. MapLibre touches `window`, so the real
 * editor is loaded with `ssr: false` (only allowed inside a client component).
 */
export const ZoneEditor = dynamic(
  () => import("./zone-editor").then((m) => m.ZoneEditor),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[70vh] min-h-[420px] w-full rounded-lg" />,
  },
);
