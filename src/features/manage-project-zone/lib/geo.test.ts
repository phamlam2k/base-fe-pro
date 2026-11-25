import { describe, expect, it } from "vitest";

import { parseLatLng } from "./geo";

describe("parseLatLng", () => {
  it("đọc 'lat, lng' copy từ Google Maps → [lng, lat]", () => {
    expect(parseLatLng("20.857312, 106.011845")).toEqual([106.011845, 20.857312]);
    expect(parseLatLng("  20.85 106.01 ")).toEqual([106.01, 20.85]);
    expect(parseLatLng("(20.85; 106.01)")).toEqual([106.01, 20.85]);
  });

  it("tự đảo khi dán ngược 'lng, lat'", () => {
    expect(parseLatLng("106.01, 20.85")).toEqual([106.01, 20.85]);
  });

  it("đọc độ-phút-giây", () => {
    const r = parseLatLng(`20°51'26.3"N 106°00'42.5"E`);
    expect(r?.[0]).toBeCloseTo(106.011806, 5);
    expect(r?.[1]).toBeCloseTo(20.857306, 5);
    expect(parseLatLng(`33°52'S 151°12'E`)?.[1]).toBeCloseTo(-33.866667, 5);
  });

  it("đọc link Google Maps, ưu tiên toạ độ ghim", () => {
    expect(
      parseLatLng(
        "https://www.google.com/maps/place/X/@20.85,106.0,17z/data=!3m1!4b1!4m6!3m5!8m2!3d20.8573!4d106.0118",
      ),
    ).toEqual([106.0118, 20.8573]);
    expect(parseLatLng("https://www.google.com/maps/@20.85,106.01,17z")).toEqual([106.01, 20.85]);
    expect(parseLatLng("https://maps.google.com/?q=20.85,106.01")).toEqual([106.01, 20.85]);
  });

  it("trả null với tên địa điểm hoặc toạ độ sai", () => {
    expect(parseLatLng("Ân Thi, Hưng Yên")).toBeNull();
    expect(parseLatLng("Quốc lộ 38")).toBeNull();
    expect(parseLatLng("200, 300")).toBeNull();
    expect(parseLatLng("")).toBeNull();
  });
});
