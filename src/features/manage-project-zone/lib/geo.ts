import area from "@turf/area";

import type { GeoPolygon } from "@/entities/project";

/** Default map view — Hà Nội city ([lng, lat]). */
export const DEFAULT_CENTER: [number, number] = [105.8342, 21.0278];
export const DEFAULT_ZOOM = 12;

const NUM = String.raw`[-+]?\d+(?:\.\d+)?`;

function dmsToDecimal(deg: string, min = "0", sec = "0", hemi = ""): number {
  const v = Number(deg) + Number(min) / 60 + Number(sec) / 3600;
  return /[SW]/i.test(hemi) ? -v : v;
}

function validLatLng(lat: number, lng: number): [number, number] | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return [lng, lat];
}

/**
 * Đọc toạ độ dán từ Google Maps → [lng, lat] (thứ tự MapLibre), không khớp → null.
 * Nhận: "20.8573, 106.0118" (lat, lng — chuột phải trên Google Maps),
 * độ-phút-giây `20°51'26.3"N 106°00'42.5"E`, hoặc link Google Maps
 * (`!3d…!4d…` = vị trí ghim, `@lat,lng,17z`, `?q=lat,lng`).
 */
export function parseLatLng(input: string): [number, number] | null {
  const s = input.trim();
  if (!s) return null;

  // Link: ưu tiên toạ độ ghim (!3d/!4d) hơn tâm khung nhìn (@).
  const pin = s.match(new RegExp(`!3d(${NUM})!4d(${NUM})`));
  if (pin) return validLatLng(Number(pin[1]), Number(pin[2]));
  const at = s.match(new RegExp(`@(${NUM}),(${NUM})`));
  if (at) return validLatLng(Number(at[1]), Number(at[2]));
  const q = s.match(new RegExp(`[?&](?:q|query|ll|destination)=(${NUM})(?:,|%2C)\\s*(${NUM})`, "i"));
  if (q) return validLatLng(Number(q[1]), Number(q[2]));

  // Độ-phút-giây: 20°51'26.3"N 106°00'42.5"E
  const dms = s.match(
    /(\d+(?:\.\d+)?)°\s*(?:(\d+(?:\.\d+)?)['′]\s*)?(?:(\d+(?:\.\d+)?)["″]\s*)?([NS])[\s,]+(\d+(?:\.\d+)?)°\s*(?:(\d+(?:\.\d+)?)['′]\s*)?(?:(\d+(?:\.\d+)?)["″]\s*)?([EW])/i,
  );
  if (dms) {
    return validLatLng(
      dmsToDecimal(dms[1], dms[2], dms[3], dms[4]),
      dmsToDecimal(dms[5], dms[6], dms[7], dms[8]),
    );
  }

  // Thập phân "lat, lng" (chấp nhận cả dấu cách / chấm phẩy làm phân cách).
  const dec = s.match(new RegExp(`^\\(?\\s*(${NUM})\\s*[,;\\s]\\s*(${NUM})\\s*\\)?$`));
  if (dec) {
    const a = Number(dec[1]);
    const b = Number(dec[2]);
    // Dán ngược "lng, lat" (vd 106.01, 20.85) → tự đảo vì |lat| ≤ 90.
    return Math.abs(a) > 90 && Math.abs(b) <= 90
      ? validLatLng(b, a)
      : validLatLng(a, b);
  }
  return null;
}

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
