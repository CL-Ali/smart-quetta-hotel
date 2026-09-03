/**
 * Time display utilities — all output in PKT (UTC+5, Asia/Karachi).
 *
 * DB stores UTC ISO strings. These helpers convert to PKT for display.
 * Using "Asia/Karachi" is more reliable than a manual +5 offset because
 * it handles any future DST changes automatically (Pakistan has not used
 * DST since 2009, but the IANA name is the correct long-term approach).
 */

const TZ = "Asia/Karachi";

/**
 * "2:35 PM" — time only, PKT
 */
export function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

/**
 * "4 Aug 2026, 2:35 PM" — date + time, PKT
 */
export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

/**
 * "4 Aug 2026" — date only, PKT
 */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TZ,
  });
}
