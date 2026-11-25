"use client";

import * as React from "react";

export type GeolocationResult =
  | { lat: number; lng: number }
  | "denied"
  | "unavailable";

/** Chrome 144+ có thẻ <geolocation>; trình duyệt khác dùng Geolocation API thường. */
export function supportsGeolocationElement(): boolean {
  return typeof window !== "undefined" && "HTMLGeolocationElement" in window;
}

/**
 * Thẻ <geolocation> của trình duyệt: bấm vào sẽ mở hộp cấp quyền, kể cả khi trang
 * đang bị chặn vị trí (điều mà navigator.geolocation không làm được). Chữ trên nút do
 * trình duyệt quyết định; style bị giới hạn (độ tương phản, nền đặc, kích thước).
 */
export function GeolocationButton({
  onResult,
  className,
}: {
  onResult: (result: GeolocationResult) => void;
  className?: string;
}) {
  const ref = React.useRef<HTMLElement>(null);
  const onResultRef = React.useRef(onResult);
  React.useEffect(() => {
    onResultRef.current = onResult;
  });

  React.useEffect(() => {
    const el = ref.current as
      | (HTMLElement & {
          position?: GeolocationPosition | null;
          error?: GeolocationPositionError | null;
        })
      | null;
    if (!el) return;
    const handle = () => {
      if (el.error) {
        onResultRef.current(el.error.code === 1 ? "denied" : "unavailable");
      } else if (el.position) {
        onResultRef.current({
          lat: el.position.coords.latitude,
          lng: el.position.coords.longitude,
        });
      }
    };
    el.addEventListener("location", handle);
    return () => el.removeEventListener("location", handle);
  }, []);

  return React.createElement("geolocation", {
    ref,
    className,
    accuracymode: "precise",
  });
}
