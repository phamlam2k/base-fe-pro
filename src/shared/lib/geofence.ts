/**
 * Kiểm tra 1 điểm GPS có nằm TRONG vùng dự án không (client-side) — để chặn nghiệm
 * thu hiện trường ngoài vùng trên WEB. Ưu tiên POLYGON (zones) → fallback vòng tròn
 * center+radius. Đồng bộ backend apps/validation/services.check_geofence + mobile.
 */
export interface GeoJsonPolygon {
  type: string;
  coordinates: number[][][]; // [[[lng,lat], ...]]
}

export interface ProjectGeofence {
  centerLat: number | null;
  centerLng: number | null;
  radiusM: number | null;
  zones: { name: string; polygon: GeoJsonPolygon }[];
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const r = 6_371_000;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dphi = ((lat2 - lat1) * Math.PI) / 180;
  const dlmb = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dphi / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dlmb / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

/** Ray-casting. Toạ độ GeoJSON là [lng, lat]; chỉ xét ring ngoài. */
function pointInPolygon(lat: number, lng: number, polygon: GeoJsonPolygon): boolean {
  const ring = polygon?.coordinates?.[0];
  if (!ring || ring.length < 3) return false;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    if (
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi || 1e-12) + xi
    ) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * @returns configured=false khi dự án CHƯA cấu hình vùng (⇒ không chặn).
 *          inside = điểm có nằm trong vùng không (khi configured).
 */
export function checkInsideZone(
  lat: number,
  lng: number,
  geofence: ProjectGeofence | null | undefined,
): { inside: boolean; configured: boolean } {
  if (!geofence) return { inside: true, configured: false };
  const zones = geofence.zones || [];
  if (zones.length > 0) {
    const inside = zones.some((z) => z.polygon && pointInPolygon(lat, lng, z.polygon));
    return { inside, configured: true };
  }
  if (geofence.centerLat != null && geofence.centerLng != null) {
    const radius = geofence.radiusM || 200;
    const dist = haversineM(geofence.centerLat, geofence.centerLng, lat, lng);
    return { inside: dist <= radius, configured: true };
  }
  return { inside: true, configured: false };
}
