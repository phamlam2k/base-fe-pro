"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const STEP = 1.25;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/**
 * Lưới ảnh thu nhỏ + lightbox xem ảnh: ← / → (nút hoặc phím mũi tên) chuyển ảnh,
 * zoom bằng con lăn chuột / nút +/− / nhấp đúp, kéo để di chuyển khi đã phóng to.
 * Ảnh MinIO (signed URL, host động) → dùng <img> thường.
 */
export function ImageGallery({
  images,
  className,
  thumbClassName,
}: {
  images: string[];
  className?: string;
  thumbClassName?: string;
}) {
  const t = useTranslations("common");
  const [index, setIndex] = React.useState<number | null>(null);
  const [scale, setScale] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const drag = React.useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [dragging, setDragging] = React.useState(false);

  const open = index !== null;
  const count = images.length;
  const src = index !== null ? images[index] : null;

  const resetZoom = React.useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const go = React.useCallback(
    (delta: number) => {
      if (count < 2) return;
      setIndex((i) => (i === null ? i : (i + delta + count) % count));
      resetZoom();
    },
    [count, resetZoom],
  );

  const zoomTo = (next: number) => {
    const s = clamp(next, MIN_SCALE, MAX_SCALE);
    setScale(s);
    if (s === 1) setOffset({ x: 0, y: 0 });
  };

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") go(-1);
    else if (e.key === "ArrowRight") go(1);
    else if (e.key === "+" || e.key === "=") zoomTo(scale * STEP);
    else if (e.key === "-") zoomTo(scale / STEP);
    else if (e.key === "0") resetZoom();
  }

  function onPointerDown(e: React.PointerEvent) {
    if (scale === 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    setDragging(true);
  }

  function endDrag() {
    drag.current = null;
    setDragging(false);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    setOffset({ x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) });
  }

  if (count === 0) return null;

  return (
    <>
      <div className={cn("flex flex-wrap gap-3", className)}>
        {images.map((url, i) => (
          <button
            key={`${i}-${url}`}
            type="button"
            onClick={() => {
              setIndex(i);
              resetZoom();
            }}
            className="block cursor-pointer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              className={cn(
                "size-20 rounded-lg border object-cover transition-opacity hover:opacity-80",
                thumbClassName,
              )}
            />
          </button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={(v) => !v && setIndex(null)}>
        <DialogContent className="sm:max-w-5xl" onKeyDown={onKeyDown}>
          <DialogTitle className="sr-only">
            {t("imageCounter", { current: (index ?? 0) + 1, total: count })}
          </DialogTitle>

          <div
            className="relative flex h-[75vh] items-center justify-center overflow-hidden rounded-md bg-black/90 select-none"
            onWheel={(e) => zoomTo(e.deltaY < 0 ? scale * STEP : scale / STEP)}
          >
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt=""
                draggable={false}
                onDoubleClick={() => (scale > 1 ? resetZoom() : zoomTo(2.5))}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                  transition: dragging ? "none" : "transform 120ms ease-out",
                }}
                className={cn(
                  "max-h-full max-w-full object-contain",
                  scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in",
                )}
              />
            ) : null}

            {count > 1 ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  aria-label={t("previousImage")}
                  onClick={() => go(-1)}
                  className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100"
                >
                  <ChevronLeft className="size-5" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  aria-label={t("nextImage")}
                  onClick={() => go(1)}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100"
                >
                  <ChevronRight className="size-5" />
                </Button>
              </>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">
              {t("imageCounter", { current: (index ?? 0) + 1, total: count })}
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={t("zoomOut")}
                disabled={scale <= MIN_SCALE}
                onClick={() => zoomTo(scale / STEP)}
              >
                <ZoomOut className="size-4" />
              </Button>
              <span className="w-12 text-center text-sm tabular-nums">
                {Math.round(scale * 100)}%
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={t("zoomIn")}
                disabled={scale >= MAX_SCALE}
                onClick={() => zoomTo(scale * STEP)}
              >
                <ZoomIn className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={t("resetZoom")}
                disabled={scale === 1}
                onClick={resetZoom}
              >
                <RotateCcw className="size-4" />
              </Button>
              {src ? (
                <Button asChild variant="outline" size="sm" className="ml-2">
                  <a href={src} download target="_blank" rel="noreferrer">
                    <Download className="size-4" /> {t("download")}
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
