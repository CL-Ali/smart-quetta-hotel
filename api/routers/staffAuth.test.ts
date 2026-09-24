import { describe, expect, it } from "vitest";
import {
  hashPassword,
  verifyPassword,
  generateStaffToken,
  verifyStaffToken,
  isWithinSlidingRefreshWindow,
  validateStaffIp,
  getClientIp,
  TOKEN_LIFETIME_SECONDS,
  REFRESH_WINDOW_SECONDS,
} from "../lib/auth";
import { appRouter } from "./index";
import type { TrpcContext } from "../lib/context";

describe("Staff Authentication & Token Engine", () => {
  it("hashes and verifies passwords accurately", () => {
    const rawPass = "admin123";
    const hash = hashPassword(rawPass);
    expect(hash).toBeTruthy();
    expect(verifyPassword("admin123", hash)).toBe(true);
    expect(verifyPassword("wrongpass", hash)).toBe(false);
  });

  it("generates and verifies 24-hour JWT session token", async () => {
    const payload = {
      staffId: 1,
      name: "Master Admin",
      email: "admin",
      role: "admin" as const,
      allowedIp: null,
    };

    const token = await generateStaffToken(payload);
    expect(token).toBeTruthy();

    const decoded = await verifyStaffToken(token);
    expect(decoded).toBeTruthy();
    expect(decoded?.staffId).toBe(1);
    expect(decoded?.name).toBe("Master Admin");
    expect(decoded?.role).toBe("admin");
    expect(decoded?.exp).toBeDefined();

    // Exp should be ~24 hours in the future
    const now = Math.floor(Date.now() / 1000);
    const diff = (decoded?.exp || 0) - now;
    expect(diff).toBeGreaterThan(TOKEN_LIFETIME_SECONDS - 60);
    expect(diff).toBeLessThanOrEqual(TOKEN_LIFETIME_SECONDS);
  });

  it("correctly identifies 2-hour sliding auto-refresh window", () => {
    const now = Math.floor(Date.now() / 1000);

    // 1. Fresh token with 20 hours remaining -> NOT in refresh window
    const exp20h = now + 20 * 3600;
    expect(isWithinSlidingRefreshWindow(exp20h)).toBe(false);

    // 2. Token with 1.5 hours remaining -> IS in refresh window
    const exp1_5h = now + Math.floor(1.5 * 3600);
    expect(isWithinSlidingRefreshWindow(exp1_5h)).toBe(true);

    // 3. Token with 50 minutes remaining -> IS in refresh window
    const exp50m = now + 50 * 60;
    expect(isWithinSlidingRefreshWindow(exp50m)).toBe(true);

    // 4. Expired token -> NOT in refresh window
    const expPast = now - 100;
    expect(isWithinSlidingRefreshWindow(expPast)).toBe(false);
  });

  it("enforces IP validation in production and allows dev bypass", () => {
    // 1. In dev environment (NODE_ENV !== 'production'), all pass
    process.env.NODE_ENV = "development";
    expect(validateStaffIp({ role: "cashier", allowedIp: "192.168.1.10" }, "192.168.1.99").valid).toBe(true);

    // 2. In production (NODE_ENV === 'production')
    process.env.NODE_ENV = "production";

    // Admin from any IP
    const adminCheck = validateStaffIp({ role: "admin", allowedIp: "192.168.1.50" }, "10.0.0.99");
    expect(adminCheck.valid).toBe(true);

    // Cashier with matching IP
    const cashierMatch = validateStaffIp({ role: "cashier", allowedIp: "192.168.1.10" }, "192.168.1.10");
    expect(cashierMatch.valid).toBe(true);

    // Cashier with mismatched IP
    const cashierMismatch = validateStaffIp({ role: "cashier", allowedIp: "192.168.1.10" }, "192.168.1.99");
    expect(cashierMismatch.valid).toBe(false);
    expect(cashierMismatch.reason).toContain("Account is bound to terminal IP");

    // Waiter with localhost variants
    const waiterLocal = validateStaffIp({ role: "waiter", allowedIp: "127.0.0.1" }, "127.0.0.1");
    expect(waiterLocal.valid).toBe(true);

    process.env.NODE_ENV = "test";
  });

  it("extracts client IP from proxy and direct headers", () => {
    const reqWithForwarded = {
      headers: { "x-forwarded-for": "192.168.1.55, 10.0.0.1" },
    };
    expect(getClientIp(reqWithForwarded)).toBe("192.168.1.55");

    const reqWithIpv6 = {
      headers: {},
      socket: { remoteAddress: "::ffff:192.168.1.66" },
    };
    expect(getClientIp(reqWithIpv6)).toBe("192.168.1.66");
  });
});
