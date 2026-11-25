"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import * as React from "react";
import * as maplibregl from "maplibre-gl";
import { TerraDraw, TerraDrawPolygonMode, TerraDrawSelectMode } from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import { useTranslations } from "next-intl";
import { Layers } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { type GeoPolygon } from "@/entities/project";

import { DEFAULT_CENTER, DEFAULT_ZOOM } from "../lib/geo";
import { PlaceSearch } from "./place-search";

// Tile đi qua proxy same-origin (/api/map-tiles/...) để né mạng người dùng chặn OSM/ESRI.
// Maplibre cần URL tuyệt đối cho template tiles → dựng theo origin hiện tại lúc tạo map.

type Basemap = "street" | "satellite";
export type FeatureId = string | number;
export type ZoneItem = { id: FeatureId; name: string; polygon: GeoPolygon };

function basemapStyle(): maplibregl.StyleSpecification {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const ESRI_SATELLITE = `${origin}/api/map-tiles/esri/{z}/{y}/{x}`;
  const OSM_STREET = `${origin}/api/map-tiles/osm/{z}/{x}/{y}`;
  return {
    version: 8,
    sources: {
      satellite: {
        type: "raster",
        tiles: [ESRI_SATELLITE],
        tileSize: 256,
        attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
      },
      street: {
        type: "raster",
        tiles: [OSM_STREET],
        tileSize: 256,
        attribution: "© OpenStreetMap contributors",
      },
    },
    layers: [
      { id: "satellite", type: "raster", source: "satellite", layout: { visibility: "none" } },
      { id: "street", type: "raster", source: "street" },
    ],
  };
}

function boundsOf(polygon: GeoPolygon): maplibregl.LngLatBoundsLike {
  let minX = 180,
    minY = 90,
    maxX = -180,
    maxY = -90;
  for (const ring of polygon.coordinates) {
    for (const [x, y] of ring) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return [
    [minX, minY],
    [maxX, maxY],
  ];
}

export type ZoneMapHandle = {
  startDraw(): void;
  cancelDraw(): void;
  removeZone(id: FeatureId): void;
  renameZone(id: FeatureId, name: string): void;
  selectZone(id: FeatureId): void;
  fitBounds(polygon: GeoPolygon): void;
  flyTo(center: [number, number], zoom?: number): void;
  loadZones(zones: Array<{ name: string; polygon: GeoPolygon }>): void;
};

type Props = {
  onZonesChange(zones: ZoneItem[], isUserAction: boolean): void;
  onDrawFinish(): void;
  onReady(): void;
};

export const ZoneMap = React.forwardRef<ZoneMapHandle, Props>(function ZoneMap(
  { onZonesChange, onDrawFinish, onReady },
  ref,
) {
  const t = useTranslations("projectZone");
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const drawRef = React.useRef<TerraDraw | null>(null);
  const tRef = React.useRef(t);
  React.useEffect(() => {
    tRef.current = t;
  }, [t]);
  const suppressDirty = React.useRef(false);

  // Stable refs for callbacks so the map effect closure never goes stale.
  const onZonesChangeRef = React.useRef(onZonesChange);
  React.useEffect(() => {
    onZonesChangeRef.current = onZonesChange;
  }, [onZonesChange]);
  const onDrawFinishRef = React.useRef(onDrawFinish);
  React.useEffect(() => {
    onDrawFinishRef.current = onDrawFinish;
  }, [onDrawFinish]);
  const onReadyRef = React.useRef(onReady);
  React.useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  const [basemap, setBasemap] = React.useState<Basemap>("street");
  const [ready, setReady] = React.useState(false);

  React.useImperativeHandle(ref, () => ({
    startDraw() {
      drawRef.current?.setMode("polygon");
    },
    cancelDraw() {
      drawRef.current?.setMode("select");
    },
    removeZone(id) {
      drawRef.current?.removeFeatures(
        [id] as Parameters<NonNullable<typeof drawRef.current>["removeFeatures"]>[0],
      );
    },
    renameZone(id, name) {
      const draw = drawRef.current;
      if (!draw) return;
      const clean = name.trim();
      if (clean) draw.updateFeatureProperties(id, { name: clean });
    },
    selectZone(id) {
      try {
        drawRef.current?.selectFeature(id);
      } catch {
        /* selection is best-effort */
      }
    },
    fitBounds(polygon) {
      mapRef.current?.fitBounds(boundsOf(polygon), { padding: 60, maxZoom: 16 });
    },
    flyTo(center, zoom = 14) {
      mapRef.current?.flyTo({ center, zoom });
    },
    loadZones(zones) {
      const draw = drawRef.current;
      if (!draw) return;
      suppressDirty.current = true;
      draw.addFeatures(
        zones.map((z) => ({
          type: "Feature",
          geometry: z.polygon,
          properties: { mode: "polygon", name: z.name },
        })) as Parameters<typeof draw.addFeatures>[0],
      );
      draw.setMode("select");
    },
  }));

  // Map + TerraDraw lifecycle
  React.useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: basemapStyle(),
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new maplibregl.GeolocateControl({ trackUserLocation: false }), "bottom-right");
    mapRef.current = map;
    map.on("error", (e) => console.error("[zone-map] MapLibre error:", e.error ?? e));

    const onLoad = () => {
      map.resize();
      const draw = new TerraDraw({
        adapter: new TerraDrawMapLibreGLAdapter({ map }),
        modes: [
          new TerraDrawPolygonMode(),
          new TerraDrawSelectMode({
            flags: {
              polygon: {
                feature: {
                  draggable: true,
                  coordinates: {
                    draggable: true,
                    midpoints: { draggable: true },
                    deletable: true,
                  },
                },
              },
            },
            styles: {
              selectionPointWidth: 7,
              selectionPointColor: "#2563eb",
              selectionPointOutlineColor: "#ffffff",
              selectionPointOutlineWidth: 2,
              midPointWidth: 5,
              midPointColor: "#f59e0b",
              midPointOutlineColor: "#ffffff",
              midPointOutlineWidth: 1,
            },
          }),
        ],
      });
      draw.start();
      draw.setMode("select");

      draw.on("change", () => {
        const isUserAction = !suppressDirty.current;
        suppressDirty.current = false;
        const named = draw
          .getSnapshot()
          .filter((f) => f.geometry?.type === "Polygon" && f.properties?.name);
        onZonesChangeRef.current(
          named.map((f) => ({
            id: f.id as FeatureId,
            name: String(f.properties.name),
            polygon: f.geometry as unknown as GeoPolygon,
          })),
          isUserAction,
        );
      });

      draw.on("finish", (id) => {
        const count = draw.getSnapshot().filter((f) => f.geometry?.type === "Polygon").length;
        draw.updateFeatureProperties(id, {
          name: tRef.current("list.defaultName", { index: count }),
        });
        onDrawFinishRef.current();
        draw.setMode("select");
      });

      drawRef.current = draw;
      setReady(true);
      onReadyRef.current();
    };

    map.on("load", onLoad);
    return () => {
      drawRef.current?.stop();
      drawRef.current = null;
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  // Basemap toggle
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setLayoutProperty("satellite", "visibility", basemap === "satellite" ? "visible" : "none");
    map.setLayoutProperty("street", "visibility", basemap === "street" ? "visible" : "none");
  }, [basemap, ready]);

  const pinRef = React.useRef<maplibregl.Marker | null>(null);
  React.useEffect(() => () => void pinRef.current?.remove(), []);

  const handleLocate = (
    center: [number, number],
    bbox: [number, number, number, number] | null,
    opts?: { exact?: boolean },
  ) => {
    const map = mapRef.current;
    if (!map) return;
    if (opts?.exact) {
      // Toạ độ chính xác → cắm ghim + zoom cỡ công trường để vẽ ngay.
      pinRef.current?.remove();
      pinRef.current = new maplibregl.Marker({ color: "#2563eb" })
        .setLngLat(center)
        .addTo(map);
      map.flyTo({ center, zoom: 18 });
      return;
    }
    if (bbox) {
      map.fitBounds(
        [
          [bbox[0], bbox[1]],
          [bbox[2], bbox[3]],
        ],
        { padding: 60, maxZoom: 16 },
      );
    } else {
      map.flyTo({ center, zoom: 14 });
    }
  };

  return (
    <>
      <div ref={containerRef} className="h-full w-full" />

      {/* Search — top-left */}
      <div className="absolute top-3 left-3 z-10">
        <PlaceSearch onLocate={handleLocate} />
      </div>

      {/* Basemap toggle — top-right */}
      <div className="absolute top-3 right-3 z-10">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="shadow-sm"
          onClick={() => setBasemap((b) => (b === "satellite" ? "street" : "satellite"))}
        >
          <Layers />
          {t(basemap === "satellite" ? "basemap.street" : "basemap.satellite")}
        </Button>
      </div>
    </>
  );
});
