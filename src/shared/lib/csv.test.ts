import { describe, expect, it } from "vitest";

import { toCsv, type CsvColumn } from "@/shared/lib/csv";

interface Row {
  name: string;
  price: number;
  note: string | null;
}

const columns: CsvColumn<Row>[] = [
  { key: "name", header: "Name" },
  { key: "price", header: "Price" },
  { key: "note", header: "Note" },
];

describe("toCsv", () => {
  it("serializes a header row plus one line per record", () => {
    const csv = toCsv(
      [{ name: "Lamp", price: 25, note: "ok" }],
      columns,
    );
    expect(csv).toBe("Name,Price,Note\r\nLamp,25,ok");
  });

  it("quotes and escapes cells containing commas, quotes and newlines (RFC 4180)", () => {
    const csv = toCsv(
      [{ name: 'Lamp, "Deluxe"', price: 25, note: "line1\nline2" }],
      columns,
    );
    expect(csv.split("\r\n")[1]).toBe('"Lamp, ""Deluxe""",25,"line1\nline2"');
  });

  it("renders null/undefined as empty cells", () => {
    const csv = toCsv([{ name: "Lamp", price: 0, note: null }], columns);
    expect(csv.split("\r\n")[1]).toBe("Lamp,0,");
  });

  it("returns only the header for an empty dataset", () => {
    expect(toCsv([], columns)).toBe("Name,Price,Note");
  });
});
