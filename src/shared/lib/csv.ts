/** Minimal CSV serialization — no dependency needed for flat exports. */

export interface CsvColumn<T> {
  key: keyof T;
  header: string;
}

function escapeCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  // Quote when the cell contains a delimiter, quote or newline (RFC 4180).
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv<T>(rows: readonly T[], columns: readonly CsvColumn<T>[]): string {
  const header = columns.map((column) => escapeCell(column.header)).join(",");
  const body = rows.map((row) =>
    columns.map((column) => escapeCell(row[column.key])).join(","),
  );
  return [header, ...body].join("\r\n");
}

/** Browser-only: trigger a download of the given CSV content. */
export function downloadCsv(filename: string, csv: string): void {
  // BOM so Excel opens UTF-8 (Vietnamese characters) correctly.
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
