/**
 * Định dạng ngày/giờ THỐNG NHẤT toàn app — luôn theo GIỜ VIỆT NAM (UTC+7):
 * - Ngày:        DD/MM/YYYY
 * - Ngày + giờ:  DD/MM/YYYY HH:mm:ss
 *
 * Dùng Intl với timeZone "Asia/Ho_Chi_Minh" để độc lập múi giờ trình duyệt.
 * Ưu tiên helper này thay vì gọi `format.dateTime` rải rác với dateStyle/timeStyle
 * khác nhau (mỗi nơi ra một kiểu).
 */
const VN_TZ = "Asia/Ho_Chi_Minh";

function toDate(value?: string | Date | null): Date | null {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(d.getTime()) ? null : d;
}

function vnParts(d: Date): Record<string, string> {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: VN_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const out: Record<string, string> = {};
  for (const { type, value } of p) out[type] = value;
  return out;
}

/** DD/MM/YYYY (giờ VN). Rỗng/không hợp lệ → "—". */
export function formatDate(value?: string | Date | null): string {
  const d = toDate(value);
  if (!d) return "—";
  const t = vnParts(d);
  return `${t.day}/${t.month}/${t.year}`;
}

/** DD/MM/YYYY HH:mm:ss (giờ VN). Rỗng/không hợp lệ → "—". */
export function formatDateTime(value?: string | Date | null): string {
  const d = toDate(value);
  if (!d) return "—";
  const t = vnParts(d);
  // giờ "24" (nửa đêm) của en-GB → chuẩn hoá về "00".
  const hh = t.hour === "24" ? "00" : t.hour;
  return `${t.day}/${t.month}/${t.year} ${hh}:${t.minute}:${t.second}`;
}

/**
 * Giá trị cho <input type="datetime-local"> theo GIỜ VN: "YYYY-MM-DDTHH:mm".
 * BE hiểu chuỗi naive này là giờ VN (khớp create form). Rỗng → "".
 */
export function toDatetimeLocalVN(value?: string | Date | null): string {
  const d = toDate(value);
  if (!d) return "";
  const t = vnParts(d);
  const hh = t.hour === "24" ? "00" : t.hour;
  return `${t.year}-${t.month}-${t.day}T${hh}:${t.minute}`;
}
