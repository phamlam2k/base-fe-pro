"use client";

// Composite shared UI (documented exception to the "shared/ui is shadcn-only" rule):
// reused by 2 sign flows (manage-construction-log, review-acceptance-request), so it
// must live in a layer below `features`. Text is passed in as props to keep this
// component i18n-free.

import * as React from "react";

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

export interface FaceSignResult {
  /** Ảnh khuôn mặt lúc ký, dạng data URL (image/jpeg). */
  photo: string;
  gpsLat?: number;
  gpsLng?: number;
}

interface Labels {
  title: string;
  hint: string;
  capture: string;
  cancel: string;
  cameraError: string;
}

/**
 * MAD-7 — Xác thực sinh trắc (khuôn mặt) trên web trước khi ký.
 * Bật webcam qua getUserMedia, chụp 1 khung hình + lấy toạ độ (best-effort),
 * trả về qua onCaptured. Không phải liveness chống giả mạo — là bằng chứng
 * khuôn mặt + vị trí lúc ký (đồng bộ với bản mobile).
 */
export function FaceSignDialog({
  open,
  onOpenChange,
  onCaptured,
  labels,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCaptured: (result: FaceSignResult) => void;
  labels: Labels;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [error, setError] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const stop = React.useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        setError(false);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      stop();
    };
  }, [open, stop]);

  const getGps = () =>
    new Promise<{ gpsLat?: number; gpsLng?: number }>((resolve) => {
      if (!navigator.geolocation) return resolve({});
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ gpsLat: pos.coords.latitude, gpsLng: pos.coords.longitude }),
        () => resolve({}),
        { enableHighAccuracy: true, timeout: 5000 },
      );
    });

  const capture = async () => {
    const video = videoRef.current;
    if (!video || busy) return;
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photo = canvas.toDataURL("image/jpeg", 0.7);
      const gps = await getGps();
      onCaptured({ photo, ...gps });
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
        </DialogHeader>
        {error ? (
          <p className="text-sm text-destructive">{labels.cameraError}</p>
        ) : (
          <div className="grid gap-2">
            <video
              ref={videoRef}
              className="w-full rounded-md bg-black aspect-video object-cover"
              muted
              playsInline
            />
            <p className="text-sm text-muted-foreground">{labels.hint}</p>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {labels.cancel}
          </Button>
          <Button disabled={error || busy} onClick={capture}>
            {labels.capture}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
