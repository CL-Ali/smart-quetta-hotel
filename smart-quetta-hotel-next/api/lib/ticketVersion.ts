import { eq } from "drizzle-orm";
import { systemSettings } from "../db/schema";

/**
 * Returns the current active ticket version (Shift/Day cycle counter) from system_settings.
 * Default is 1 if not set.
 */
export function getCurrentTicketVersion(db: any): number {
  try {
    const row = db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "currentTicketVersion"))
      .all()[0];

    if (!row || !row.value) return 1;
    const num = parseInt(row.value, 10);
    return isNaN(num) || num < 1 ? 1 : num;
  } catch {
    return 1;
  }
}

/**
 * Returns the current shift status ("active" | "verifying" | "closed").
 */
export function getCurrentShiftStatus(db: any): "active" | "verifying" | "closed" {
  try {
    const row = db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, "shiftStatus"))
      .all()[0];

    if (!row || !row.value) return "active";
    return (row.value as "active" | "verifying" | "closed") || "active";
  } catch {
    return "active";
  }
}

/**
 * Sets the system ticket version and shift status.
 */
export function setShiftSessionState(
  db: any,
  version: number,
  status: "active" | "verifying" | "closed"
) {
  const nowIso = new Date().toISOString();

  // Update currentTicketVersion
  const verRow = db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, "currentTicketVersion"))
    .all()[0];
  if (verRow) {
    db.update(systemSettings)
      .set({ value: version.toString(), updatedAt: nowIso })
      .where(eq(systemSettings.key, "currentTicketVersion"))
      .run();
  } else {
    db.insert(systemSettings)
      .values({ key: "currentTicketVersion", value: version.toString(), updatedAt: nowIso })
      .run();
  }

  // Update shiftStatus
  const statusRow = db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, "shiftStatus"))
    .all()[0];
  if (statusRow) {
    db.update(systemSettings)
      .set({ value: status, updatedAt: nowIso })
      .where(eq(systemSettings.key, "shiftStatus"))
      .run();
  } else {
    db.insert(systemSettings)
      .values({ key: "shiftStatus", value: status, updatedAt: nowIso })
      .run();
  }
}
