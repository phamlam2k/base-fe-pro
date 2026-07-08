import type { NextRequest } from "next/server";

import { jsonData, jsonError, requireAuth } from "@/shared/api/server";

/**
 * Geocoding / place-search proxy (BFF). Keeps the provider swappable and the
 * key (if any) server-side. Currently backed by Photon (OSM, key-less, built
 * for autocomplete). To upgrade coverage later, swap the fetch below for
 * Mapbox Search / Google Places — the client keeps calling `/api/geocode`.
 *
 * Purpose here is coarse: "fly the map roughly to an area", then the admin
 * draws by eye — so OSM precision is enough.
 */
interface GeocodeResult {
  id: string;
  label: string;
  center: [number, number]; // [lng, lat]
  bbox: [number, number, number, number] | null; // [west, south, east, north]
}

const PHOTON_URL = "https://photon.komoot.io/api";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if ("response" in auth) return auth.response;

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 3) return jsonData<GeocodeResult[]>([]);

  const url = new URL(PHOTON_URL);
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "6");
  url.searchParams.set("lang", "default");
  // Bias results toward Vietnam.
  url.searchParams.set("lat", "16");
  url.searchParams.set("lon", "106");

  let data: { features?: RawFeature[] };
  try {
    const res = await fetch(url, { headers: { "User-Agent": "base-fe-pro/qltvgs" } });
    if (!res.ok) return jsonError(502, "GEOCODE_ERROR", "Dịch vụ tìm kiếm tạm thời bận.");
    data = await res.json();
  } catch {
    return jsonError(502, "GEOCODE_ERROR", "Không kết nối được dịch vụ tìm kiếm.");
  }

  const results: GeocodeResult[] = (data.features ?? [])
    .map((f, i): GeocodeResult | null => {
      const c = f.geometry?.coordinates;
      if (!c) return null;
      const p = f.properties ?? {};
      const label = [p.name, p.street, p.district, p.city, p.state, p.country]
        .filter(Boolean)
        .join(", ");
      // Photon extent = [minLon, maxLat, maxLon, minLat] → [W, S, E, N].
      const e = p.extent;
      const bbox = e ? ([e[0], e[3], e[2], e[1]] as [number, number, number, number]) : null;
      return { id: `${p.osm_id ?? i}`, label: label || q, center: c, bbox };
    })
    .filter((r): r is GeocodeResult => r !== null);

  return jsonData(results);
}

interface RawFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    street?: string;
    district?: string;
    city?: string;
    state?: string;
    country?: string;
    osm_id?: number;
    extent?: [number, number, number, number];
  };
}
