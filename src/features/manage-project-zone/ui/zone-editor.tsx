"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import * as React from "react";
import * as maplibregl from "maplibre-gl";
import { TerraDraw, TerraDrawPolygonMode, TerraDrawSelectMode } from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Check,
  Layers,
  Loader2,
  Pencil,
  PenLine,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ScrollArea } from "@/shared/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { cn } from "@/shared/lib/utils";
import { projectQueries, type GeoPolygon } from "@/entities/project";

import { useSaveProjectZones } from "../model/hooks";
import { DEFAULT_CENTER, DEFAULT_ZOOM, formatHectares, polygonHectares } from "../lib/geo";
import { PlaceSearch } from "./place-search";

const ESRI_SATELLITE =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const OSM_STREET = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

type Basemap = "street" | "satellite";
type FeatureId = string | number;
type ZoneItem = { id: FeatureId; name: string; polygon: GeoPolygon };

function basemapStyle(): maplibregl.StyleSpecification {
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

export function ZoneEditor({ projectId }: { projectId: string; projectName?: string }) {
  const t = useTranslations("projectZone");
  const zonesQuery = useQuery(projectQueries.zones(projectId));
  const save = useSaveProjectZones(projectId);

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const drawRef = React.useRef<TerraDraw | null>(null);
  const tRef = React.useRef(t);
  React.useEffect(() => {
    tRef.current = t;
  }, [t]);
  const suppressDirty = React.useRef(false);
  const loadedRef = React.useRef(false);

  const [ready, setReady] = React.useState(false);
  const [drawing, setDrawing] = React.useState(false);
  const [basemap, setBasemap] = React.useState<Basemap>("street");
  const [zones, setZones] = React.useState<ZoneItem[]>([]);
  const [dirty, setDirty] = React.useState(false);

  // Inline rename + save dialog state.
  const [editingId, setEditingId] = React.useState<FeatureId | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const [saveOpen, setSaveOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<Record<string, string>>({});

  const zoomTo = (polygon: GeoPolygon) =>
    mapRef.current?.fitBounds(boundsOf(polygon), { padding: 60, maxZoom: 16 });

  // --- Map + Terra Draw lifecycle -------------------------------------------
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
                  // Move the whole zone…
                  draggable: true,
                  coordinates: {
                    // …or drag individual corners, add midpoints, delete corners.
                    draggable: true,
                    midpoints: { draggable: true },
                    deletable: true,
                  },
                },
              },
            },
            // Bigger, colour-coded handles so vertices (blue) and midpoints
            // (amber — drag to insert a point) are easy to grab and refine.
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

      // A zone is a *named* polygon; in-progress (unnamed) drawing is excluded.
      const reconcile = (markDirty: boolean) => {
        const named = draw
          .getSnapshot()
          .filter((f) => f.geometry?.type === "Polygon" && f.properties?.name);
        setZones(
          named.map((f) => ({
            id: f.id as FeatureId,
            name: String(f.properties.name),
            polygon: f.geometry as unknown as GeoPolygon,
          })),
        );
        if (markDirty) setDirty(true);
      };

      draw.on("change", () => {
        reconcile(!suppressDirty.current);
        suppressDirty.current = false;
      });
      draw.on("finish", (id) => {
        // Auto-name the just-drawn polygon (user can rename in the list / on save).
        const count = draw.getSnapshot().filter((f) => f.geometry?.type === "Polygon").length;
        draw.updateFeatureProperties(id, {
          name: tRef.current("list.defaultName", { index: count }),
        });
        setDrawing(false);
        draw.setMode("select");
      });

      drawRef.current = draw;
      setReady(true);
    };

    map.on("load", onLoad);
    return () => {
      drawRef.current?.stop();
      drawRef.current = null;
      map.remove();
      mapRef.current = null;
      setReady(false);
      loadedRef.current = false;
    };
  }, []);

  // --- Load saved zones once, zoom to the first ------------------------------
  React.useEffect(() => {
    const draw = drawRef.current;
    if (!ready || !draw || loadedRef.current) return;
    loadedRef.current = true;
    const saved = zonesQuery.data?.zones ?? [];
    if (saved.length) {
      suppressDirty.current = true;
      draw.addFeatures(
        saved.map((z) => ({
          type: "Feature",
          geometry: z.polygon,
          properties: { mode: "polygon", name: z.name },
        })) as Parameters<typeof draw.addFeatures>[0],
      );
      draw.setMode("select");
      zoomTo(saved[0].polygon);
    }
  }, [ready, zonesQuery.data]);

  // --- Basemap toggle --------------------------------------------------------
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setLayoutProperty("satellite", "visibility", basemap === "satellite" ? "visible" : "none");
    map.setLayoutProperty("street", "visibility", basemap === "street" ? "visible" : "none");
  }, [basemap, ready]);

  // --- Actions ---------------------------------------------------------------
  const startDrawing = () => {
    drawRef.current?.setMode("polygon");
    setDrawing(true);
  };
  const cancelDrawing = () => {
    drawRef.current?.setMode("select");
    setDrawing(false);
  };
  const removeZone = (id: FeatureId) =>
    drawRef.current?.removeFeatures([id] as Parameters<
      NonNullable<typeof drawRef.current>["removeFeatures"]
    >[0]);

  const renameZone = (id: FeatureId, name: string) => {
    const draw = drawRef.current;
    if (!draw) return;
    const clean = name.trim();
    if (clean) draw.updateFeatureProperties(id, { name: clean });
    setEditingId(null);
  };

  const editPolygon = (zone: ZoneItem) => {
    const draw = drawRef.current;
    if (!draw) return;
    draw.setMode("select");
    setDrawing(false);
    zoomTo(zone.polygon);
    try {
      draw.selectFeature(zone.id);
    } catch {
      /* selection is best-effort */
    }
    toast.info(t("editPolygonHint"));
  };

  const handleLocate = (center: [number, number], bbox: [number, number, number, number] | null) => {
    const map = mapRef.current;
    if (!map) return;
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

  const openSave = () => {
    if (zones.length === 0) {
      save.mutate([], { onSuccess: () => setDirty(false) });
      return;
    }
    setDraft(Object.fromEntries(zones.map((z) => [String(z.id), z.name])));
    setSaveOpen(true);
  };
  const confirmSave = () => {
    const draw = drawRef.current;
    const payload = zones.map((z) => {
      const name = (draft[String(z.id)] ?? z.name).trim();
      if (draw && name && name !== z.name) draw.updateFeatureProperties(z.id, { name });
      return { name, polygon: z.polygon };
    });
    save.mutate(payload, {
      onSuccess: () => {
        setDirty(false);
        setSaveOpen(false);
      },
    });
  };
  const draftHasEmpty = zones.some((z) => !(draft[String(z.id)] ?? z.name).trim());

  const totalHa = zones.reduce((sum, z) => {
    try {
      return sum + polygonHectares(z.polygon);
    } catch {
      return sum;
    }
  }, 0);

  return (
    <div className="relative h-[70vh] min-h-[420px] w-full overflow-hidden rounded-lg border">
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

      {/* Zone list — right column */}
      <div className="absolute top-14 right-3 z-10 w-72">
        <div className="bg-background/95 rounded-lg border shadow-lg backdrop-blur">
          <div className="px-3 py-2 text-sm font-medium">
            {t("list.title", { count: zones.length })}
          </div>
          <ScrollArea className="max-h-64">
            {zones.length === 0 ? (
              <p className="text-muted-foreground px-3 pb-3 text-xs">{t("list.empty")}</p>
            ) : (
              <ul className="grid gap-1 px-2 pb-2">
                {zones.map((zone) => (
                  <li
                    key={String(zone.id)}
                    className="hover:bg-accent flex items-center gap-1 rounded-md px-2 py-1.5"
                  >
                    {editingId === zone.id ? (
                      <Input
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => renameZone(zone.id, editingName)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") renameZone(zone.id, editingName);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="h-7 flex-1"
                      />
                    ) : (
                      <button
                        type="button"
                        className="grid flex-1 text-left"
                        onClick={() => zoomTo(zone.polygon)}
                      >
                        <span className="truncate text-sm font-medium">{zone.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {formatHectares(polygonHectares(zone.polygon))}
                        </span>
                      </button>
                    )}
                    {editingId === zone.id ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("saveDialog.confirm")}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => renameZone(zone.id, editingName)}
                      >
                        <Check />
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("list.rename")}
                          onClick={() => {
                            setEditingId(zone.id);
                            setEditingName(zone.name);
                          }}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("list.editShape")}
                          onClick={() => editPolygon(zone)}
                        >
                          <PenLine />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("clear")}
                          onClick={() => removeZone(zone.id)}
                        >
                          <Trash2 className="text-destructive" />
                        </Button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Control bar — bottom */}
      <div className="absolute inset-x-3 bottom-3 z-10">
        <div className="bg-background/95 grid gap-3 rounded-lg border p-3 shadow-lg backdrop-blur sm:flex sm:items-center sm:justify-between">
          {drawing ? (
            <p className="text-muted-foreground text-sm">{t("draw.hint")}</p>
          ) : zones.length ? (
            <span className="text-sm font-medium">
              {t("total", { value: formatHectares(totalHa) })}
              {dirty ? (
                <span className="text-amber-600 dark:text-amber-500"> · {t("unsaved")}</span>
              ) : null}
            </span>
          ) : (
            <div className="grid gap-0.5">
              <span className="text-sm font-medium">{t("empty.title")}</span>
              <span className="text-muted-foreground text-xs">
                {t("empty.step1")} · {t("empty.step2")} · {t("empty.step3")}
              </span>
            </div>
          )}

          <div className="flex shrink-0 items-center gap-2">
            {drawing ? (
              <Button type="button" variant="outline" size="sm" onClick={cancelDrawing}>
                <X />
                {t("draw.cancel")}
              </Button>
            ) : (
              <Button
                type="button"
                variant={zones.length ? "outline" : "default"}
                size="sm"
                onClick={startDrawing}
                disabled={!ready}
              >
                <Plus />
                {t("draw.start")}
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={openSave}
              disabled={!dirty || save.isPending || drawing}
              className={cn(!dirty && "opacity-60")}
            >
              {save.isPending ? <Loader2 className="animate-spin" /> : <Save />}
              {t(save.isPending ? "saving" : "save")}
            </Button>
          </div>
        </div>
      </div>

      {/* Save dialog — name each zone before persisting */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("saveDialog.title")}</DialogTitle>
            <DialogDescription>{t("saveDialog.description")}</DialogDescription>
          </DialogHeader>
          <div className="grid max-h-72 gap-3 overflow-auto">
            {zones.map((zone, i) => (
              <div key={String(zone.id)} className="grid gap-1.5">
                <Label className="text-muted-foreground text-xs">
                  {t("list.item", { index: i + 1 })} ·{" "}
                  {formatHectares(polygonHectares(zone.polygon))}
                </Label>
                <Input
                  value={draft[String(zone.id)] ?? zone.name}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [String(zone.id)]: e.target.value }))
                  }
                  placeholder={t("saveDialog.namePlaceholder")}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSaveOpen(false)}>
              {t("draw.cancel")}
            </Button>
            <Button
              type="button"
              onClick={confirmSave}
              disabled={draftHasEmpty || save.isPending}
            >
              {save.isPending ? <Loader2 className="animate-spin" /> : null}
              {t("saveDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
