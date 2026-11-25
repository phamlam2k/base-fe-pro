"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

export type FileKind = "image" | "pdf" | "other";

/** Suy loại file theo phần mở rộng (bỏ query string của signed URL). */
export function detectFileKind(nameOrUrl?: string | null): FileKind {
  if (!nameOrUrl) return "other";
  const clean = nameOrUrl.split("?")[0].split("#")[0].toLowerCase();
  if (/\.(png|jpe?g|gif|webp|bmp|heic|heif|avif|svg)$/.test(clean)) return "image";
  if (/\.pdf$/.test(clean)) return "pdf";
  return "other";
}

function DownloadButton({ href, name }: { href: string; name?: string | null }) {
  const t = useTranslations("common");
  return (
    <Button asChild variant="outline" size="sm">
      <a href={href} download={name ?? true} target="_blank" rel="noreferrer">
        <Download className="size-4" /> {t("download")}
      </a>
    </Button>
  );
}

function ImageLightbox({
  open,
  onOpenChange,
  src,
  name,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  src: string;
  name?: string | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogTitle className="sr-only">{name ?? "Ảnh"}</DialogTitle>
        {/* Ảnh MinIO (signed URL, host động) → dùng <img> thường. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name ?? ""}
          className="max-h-[75vh] w-full rounded-md object-contain"
        />
        <div className="flex justify-end">
          <DownloadButton href={src} name={name} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PdfViewerDialog({
  open,
  onOpenChange,
  url,
  downloadUrl,
  name,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  url: string;
  downloadUrl?: string;
  name?: string | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader className="flex-row items-center justify-between gap-3 pr-8">
          <DialogTitle className="truncate">{name ?? "Tài liệu PDF"}</DialogTitle>
          <DownloadButton href={downloadUrl ?? url} name={name} />
        </DialogHeader>
        <iframe
          src={url}
          title={name ?? "PDF"}
          className="h-[75vh] w-full rounded-md border"
        />
      </DialogContent>
    </Dialog>
  );
}

/** Mở file để download (dùng cho loại không xem trước được). */
function triggerDownload(href: string, name?: string | null) {
  const a = document.createElement("a");
  a.href = href;
  if (name) a.download = name;
  a.target = "_blank";
  a.rel = "noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Trigger click → xem/tải file theo loại:
 *  - ảnh  → modal lightbox
 *  - pdf  → modal iframe + nút tải
 *  - khác → tải xuống thẳng (không modal)
 *
 * ``url`` là URL hiển thị inline (ảnh/pdf); ``downloadUrl`` (tùy chọn) dùng cho nút tải.
 * ``kind`` ép loại khi URL không có phần mở rộng (vd endpoint tải).
 */
export function FileViewer({
  url,
  downloadUrl,
  name,
  kind,
  className,
  children,
}: {
  url: string;
  downloadUrl?: string;
  name?: string | null;
  kind?: FileKind;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const resolved = kind ?? detectFileKind(name ?? url);

  function onClick() {
    if (resolved === "other") {
      triggerDownload(downloadUrl ?? url, name);
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className={cn("cursor-pointer text-left", className)}
      >
        {children}
      </button>
      {resolved === "image" ? (
        <ImageLightbox open={open} onOpenChange={setOpen} src={url} name={name} />
      ) : null}
      {resolved === "pdf" ? (
        <PdfViewerDialog
          open={open}
          onOpenChange={setOpen}
          url={url}
          downloadUrl={downloadUrl}
          name={name}
        />
      ) : null}
    </>
  );
}
