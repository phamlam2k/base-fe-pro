"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Check,
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
import { projectQueries } from "@/entities/project";

import { useSaveProjectZones } from "../model/hooks";
import { formatHectares, polygonHectares } from "../lib/geo";
import {
  ZoneMap,
  type FeatureId,
  type ZoneItem,
  type ZoneMapHandle,
} from "./zone-map";

export function ZoneEditor({
  projectId,
}: {
  projectId: string;
  projectName?: string;
}) {
  const t = useTranslations("projectZone");
  const zonesQuery = useQuery(projectQueries.zones(projectId));
  const save = useSaveProjectZones(projectId);

  const zoneMapRef = React.useRef<ZoneMapHandle>(null);
  const loadedRef = React.useRef(false);

  const [ready, setReady] = React.useState(false);
  const [drawing, setDrawing] = React.useState(false);
  const [zones, setZones] = React.useState<ZoneItem[]>([]);
  const [dirty, setDirty] = React.useState(false);

  const [editingId, setEditingId] = React.useState<FeatureId | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const [saveOpen, setSaveOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<Record<string, string>>({});

  // Load saved zones once the map is ready.
  React.useEffect(() => {
    if (!ready || loadedRef.current || !zonesQuery.data) return;
    loadedRef.current = true;
    const saved = zonesQuery.data?.zones ?? [];
    if (saved.length) {
      zoneMapRef.current?.loadZones(saved);
      zoneMapRef.current?.fitBounds(saved[0].polygon);
    }
  }, [ready, zonesQuery.data]);

  const handleZonesChange = (newZones: ZoneItem[], isUserAction: boolean) => {
    setZones(newZones);
    if (isUserAction) setDirty(true);
  };

  // --- Actions ---------------------------------------------------------------
  const startDrawing = () => {
    zoneMapRef.current?.startDraw();
    setDrawing(true);
  };
  const cancelDrawing = () => {
    zoneMapRef.current?.cancelDraw();
    setDrawing(false);
  };
  const removeZone = (id: FeatureId) => zoneMapRef.current?.removeZone(id);

  const renameZone = (id: FeatureId, name: string) => {
    zoneMapRef.current?.renameZone(id, name);
    setEditingId(null);
  };

  const editPolygon = (zone: ZoneItem) => {
    zoneMapRef.current?.fitBounds(zone.polygon);
    zoneMapRef.current?.selectZone(zone.id);
    setDrawing(false);
    toast.info(t("editPolygonHint"));
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
    const payload = zones.map((z) => {
      const name = (draft[String(z.id)] ?? z.name).trim();
      if (name && name !== z.name) zoneMapRef.current?.renameZone(z.id, name);
      return { name, polygon: z.polygon };
    });
    save.mutate(payload, {
      onSuccess: () => {
        setDirty(false);
        setSaveOpen(false);
      },
    });
  };
  const draftHasEmpty = zones.some(
    (z) => !(draft[String(z.id)] ?? z.name).trim(),
  );

  const totalHa = zones.reduce((sum, z) => {
    try {
      return sum + polygonHectares(z.polygon);
    } catch {
      return sum;
    }
  }, 0);

  return (
    <div className="relative h-[70vh] min-h-[420px] w-full overflow-hidden rounded-lg border">
      <ZoneMap
        ref={zoneMapRef}
        onZonesChange={handleZonesChange}
        onDrawFinish={() => setDrawing(false)}
        onReady={() => setReady(true)}
      />

      {/* Zone list — right column */}
      <div className="absolute top-14 right-3 z-10 w-72">
        <div className="bg-background/95 rounded-lg border shadow-lg backdrop-blur">
          <div className="px-3 py-2 text-sm font-medium">
            {t("list.title", { count: zones.length })}
          </div>
          <ScrollArea className="max-h-64">
            {zones.length === 0 ? (
              <p className="text-muted-foreground px-3 pb-3 text-xs">
                {t("list.empty")}
              </p>
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
                          if (e.key === "Enter")
                            renameZone(zone.id, editingName);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="h-7 flex-1"
                      />
                    ) : (
                      <button
                        type="button"
                        className="grid flex-1 text-left"
                        onClick={() =>
                          zoneMapRef.current?.fitBounds(zone.polygon)
                        }
                      >
                        <span className="truncate text-sm font-medium">
                          {zone.name}
                        </span>
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
                <span className="text-amber-600 dark:text-amber-500">
                  {" "}
                  · {t("unsaved")}
                </span>
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={cancelDrawing}
              >
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
                    setDraft((d) => ({
                      ...d,
                      [String(zone.id)]: e.target.value,
                    }))
                  }
                  placeholder={t("saveDialog.namePlaceholder")}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSaveOpen(false)}
            >
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
