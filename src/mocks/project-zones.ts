import "server-only";

/**
 * In-memory store for project zones (site boundaries).
 *
 * Self-contained mock so the map feature runs locally without the Django
 * backend. When the backend zone endpoint (PostGIS `PolygonField`) is ready,
 * swap the route handler over to `callBackend` — the entity/feature/UI stay
 * unchanged. Cached on `globalThis` so it survives HMR in dev.
 */
interface StoredZone {
  polygon: unknown;
  updatedAt: string | null;
}

const globalStore = globalThis as unknown as {
  __mockProjectZones?: Map<string, StoredZone>;
};

export function getProjectZonesDb(): Map<string, StoredZone> {
  if (!globalStore.__mockProjectZones) {
    globalStore.__mockProjectZones = new Map();
  }
  return globalStore.__mockProjectZones;
}
