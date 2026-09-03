/**
 * Dashboard PIN gate — client-side helpers.
 *
 * Stores a one-way transform of the PIN in localStorage so the raw PIN
 * is never visible in DevTools storage panel. The transform uses a simple
 * deterministic encoding (not crypto hashing) so it works on plain HTTP
 * LAN deployments where crypto.subtle is unavailable.
 *
 * The backend compares the raw PIN from DASHBOARD_PIN env var — the
 * frontend reverses the encoding before sending so they always match.
 * The encoding only prevents casual shoulder-surfing of localStorage.
 *
 * Phase 6: replace with per-staff JWT tokens once OAuth roles are ready.
 */

const STORAGE_KEY = "qh_dashboard_hash";

/**
 * Simple reversible obfuscation — base64 of the pin.
 * Not cryptographic, but prevents plaintext in localStorage.
 * Works on HTTP and HTTPS without Web Crypto.
 */
function encode(pin: string): string {
  return btoa(pin.trim());
}

function decode(stored: string): string {
  try { return atob(stored); } catch { return ""; }
}

/** Returns the stored PIN (decoded), or empty string if not set. */
export function getDashboardPin(): string {
  const stored = localStorage.getItem(STORAGE_KEY) ?? "";
  return stored ? decode(stored) : "";
}

/**
 * Encodes and saves the PIN to localStorage.
 * Returns immediately (sync) — no async needed without Web Crypto.
 */
export async function hashAndSavePin(pin: string): Promise<string> {
  const encoded = encode(pin.trim());
  localStorage.setItem(STORAGE_KEY, encoded);
  return pin.trim(); // return raw PIN so header injection uses correct value
}

/** Clears the stored value (locks the dashboard on this device). */
export function clearDashboardPin(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** True if a PIN is currently stored (device has been unlocked). */
export function isDashboardUnlocked(): boolean {
  return !!localStorage.getItem(STORAGE_KEY);
}
