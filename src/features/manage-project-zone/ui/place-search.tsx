"use client";

import * as React from "react";
import { Crosshair, Loader2, MapPin, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { Input } from "@/shared/ui/input";
import { useDebounce } from "@/shared/lib/use-debounce";

import { parseLatLng } from "../lib/geo";

interface Place {
  id: string;
  label: string;
  center: [number, number];
  bbox: [number, number, number, number] | null;
}

async function geocode(q: string): Promise<Place[]> {
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: Place[] };
  return json.data ?? [];
}

/**
 * Address / place autocomplete. Non-tech friendly: type a road / ward / place,
 * pick a suggestion, the map flies there — then draw by eye. Backed by the
 * `/api/geocode` BFF (provider-swappable). Also accepts coordinates pasted
 * from Google Maps ("lat, lng", DMS or a maps link) — jumps straight there.
 */
export function PlaceSearch({
  onLocate,
}: {
  onLocate: (
    center: [number, number],
    bbox: Place["bbox"],
    opts?: { exact?: boolean },
  ) => void;
}) {
  const t = useTranslations("projectZone");
  const [query, setQuery] = React.useState("");
  const [dismissed, setDismissed] = React.useState(false);
  const term = useDebounce(query).trim();
  // Toạ độ dán vào → không cần geocode, nhảy thẳng tới điểm.
  const coords = React.useMemo(() => parseLatLng(query), [query]);
  const goToCoords = () => {
    if (!coords) return;
    onLocate(coords, null, { exact: true });
    setDismissed(true);
  };

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["geocode", term],
    queryFn: () => geocode(term),
    enabled: term.length >= 3 && !coords,
    staleTime: 5 * 60_000,
  });

  const showList =
    !dismissed && (coords !== null || (term.length >= 3 && results.length > 0));

  return (
    <div className="relative w-full max-w-md">
      <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setDismissed(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && coords) {
            e.preventDefault();
            goToCoords();
          }
        }}
        placeholder={t("searchPlaceholder")}
        className="bg-background pl-8 shadow-sm"
      />
      {isFetching && term.length >= 3 && !coords ? (
        <Loader2 className="text-muted-foreground absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin" />
      ) : null}

      {showList ? (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setDismissed(true)}
          />
          <ul className="bg-popover absolute z-20 mt-1 w-full overflow-hidden rounded-md border shadow-md">
            {coords ? (
              <li>
                <button
                  type="button"
                  className="hover:bg-accent flex w-full items-start gap-2 px-3 py-2 text-left text-sm"
                  onClick={goToCoords}
                >
                  <Crosshair className="text-primary mt-0.5 size-4 shrink-0" />
                  <span>
                    {t("goToCoords", {
                      lat: coords[1].toFixed(6),
                      lng: coords[0].toFixed(6),
                    })}
                  </span>
                </button>
              </li>
            ) : null}
            {coords
              ? null
              : results.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  className="hover:bg-accent flex w-full items-start gap-2 px-3 py-2 text-left text-sm"
                  onClick={() => {
                    onLocate(place.center, place.bbox);
                    setQuery(place.label);
                    setDismissed(true);
                  }}
                >
                  <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <span className="line-clamp-2">{place.label}</span>
                </button>
              </li>
                ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
