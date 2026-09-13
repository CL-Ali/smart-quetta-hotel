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

/**
 * Check if a timestamp is from TODAY in PKT timezone
 */
export function isToday(iso: string | null | undefined): boolean {
  if (!iso) return true;
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return true;
    const datePKT = d.toLocaleDateString("en-PK", { timeZone: TZ });
    const nowPKT = new Date().toLocaleDateString("en-PK", { timeZone: TZ });
    return datePKT === nowPKT;
  } catch {
    return true;
  }
}

/**
 * Check if a timestamp is from recent session / today (within 24 hours or today)
 */
export function isRecentOrToday(iso: string | null | undefined, maxHours: number = 24): boolean {
  if (!iso) return true;
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return true;
    const diffMs = Date.now() - d.getTime();
    return diffMs <= maxHours * 60 * 60 * 1000 || isToday(iso);
  } catch {
    return true;
  }
}
