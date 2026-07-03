"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type UrlStateValue = string | number;
type UrlState = Record<string, UrlStateValue>;

/**
 * React state initialized from — and mirrored back to — the URL query string.
 *
 * State is the source of truth (simple mental model, easy to test); the URL
 * is a write-through mirror, so filtered/paginated views are shareable and
 * survive a refresh. Only values differing from `defaults` appear in the URL.
 */
export function useUrlSyncedState<T extends UrlState>(initialDefaults: T) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Snapshot on first render — later changes to the argument are ignored.
  const [defaults] = React.useState(initialDefaults);

  const [state, setState] = React.useState<T>(() => {
    const initial = { ...defaults };
    for (const key of Object.keys(initial)) {
      const raw = searchParams.get(key);
      if (raw === null) continue;
      const parsed =
        typeof initial[key] === "number" ? Number(raw) : raw;
      if (typeof parsed === "number" && Number.isNaN(parsed)) continue;
      (initial as UrlState)[key] = parsed;
    }
    return initial;
  });

  React.useEffect(() => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(state)) {
      if (value !== defaults[key] && value !== "") {
        params.set(key, String(value));
      }
    }
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }, [state, pathname, router, defaults]);

  const patch = React.useCallback((partial: Partial<T>) => {
    setState((previous) => ({ ...previous, ...partial }));
  }, []);

  return [state, patch] as const;
}
