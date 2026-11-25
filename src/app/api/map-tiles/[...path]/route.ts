import type { NextRequest } from "next/server";

/**
 * Proxy tile bản đồ qua chính domain app (same-origin) để né việc mạng người dùng
 * (ISP/DNS ở VN) chặn `tile.openstreetmap.org` / `arcgisonline.com`. Trình duyệt chỉ
 * gọi `/api/map-tiles/...`; server đi lấy tile giùm + cache (giảm tải cho OSM, đúng
 * chính sách usage của họ nhờ có User-Agent định danh).
 *
 * Chỉ cho phép DANH SÁCH TRẮNG nhà cung cấp (chống bị lợi dụng làm open-proxy/SSRF).
 */

// provider → build(seg[z,a,b]) → URL upstream. Thứ tự seg theo template maplibre cấu hình.
const UPSTREAMS: Record<string, (z: string, a: string, b: string) => string> = {
  // OSM: /osm/{z}/{x}/{y}
  osm: (z, x, y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
  // ESRI World Imagery: /esri/{z}/{y}/{x} (ESRI dùng thứ tự z/y/x)
  esri: (z, y, x) =>
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
};

const UA = "qltvgs-map-proxy/1.0 (+https://qltvgs.nvina.com.vn)";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const [provider, ...seg] = path ?? [];
  const build = UPSTREAMS[provider];
  // Đúng 3 đoạn toạ độ, tất cả là số nguyên (chống chèn URL tuỳ ý).
  if (!build || seg.length !== 3 || !seg.every((v) => /^\d+$/.test(v))) {
    return new Response("Not found", { status: 404 });
  }

  const url = build(seg[0], seg[1], seg[2]);
  try {
    const upstream = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "image/*" },
      // Cache ở tầng fetch của Next (tile gần như bất biến).
      next: { revalidate: 604800 },
    });
    if (!upstream.ok) {
      return new Response("Upstream error", { status: 502 });
    }
    const body = await upstream.arrayBuffer();
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "image/png",
        // browser cache 1 ngày; CDN/Cloudflare cache 7 ngày.
        "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
      },
    });
  } catch {
    return new Response("Fetch failed", { status: 502 });
  }
}
