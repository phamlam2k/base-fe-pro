import area from "@turf/area";

import type { GeoPolygon } from "@/entities/project";

/** Default map view — Hà Nội city ([lng, lat]). */
export const DEFAULT_CENTER: [number, number] = [105.8342, 21.0278];
export const DEFAULT_ZOOM = 12;

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
