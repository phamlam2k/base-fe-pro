import area from "@turf/area";

import type { GeoPolygon } from "@/entities/project";

/** Rough geographic center + zoom of Vietnam — the map's default view. */
export const VN_CENTER: [number, number] = [106.0, 16.0];
export const VN_DEFAULT_ZOOM = 5;

/** Area of a GeoJSON polygon, in hectares (1 ha = 10,000 m²). */
export function polygonHectares(polygon: GeoPolygon): number {
  const squareMeters = area(polygon as Parameters<typeof area>[0]);
  return squareMeters / 10_000;
}

export function formatHectares(hectares: number): string {
  return hectares >= 100
    ? `${Math.round(hectares).toLocaleString("vi-VN")} ha`
    : `${hectares.toFixed(2)} ha`;
}
