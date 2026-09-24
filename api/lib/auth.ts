import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";
import type { Request, Response } from "express";

export const STAFF_COOKIE_NAME = "qh_staff_session";
export const TOKEN_LIFETIME_SECONDS = 24 * 60 * 60; // 24 Hours
export const REFRESH_WINDOW_SECONDS = 2 * 60 * 60;  // 2 Hours sliding window

const AUTH_SECRET_STRING = process.env.JWT_SECRET || "smart-quetta-hotel-jwt-super-secret-key-2026";
const AUTH_SECRET = new TextEncoder().encode(AUTH_SECRET_STRING);
const PASSWORD_SALT = "quetta-hotel-salt-2026";

export interface StaffTokenPayload {
  staffId: number;
  name: string;
  email: string;
  role: "admin" | "cashier" | "waiter" | "kitchen";
  stationName?: string | null;
  assignedCashierId?: number | null;
  permissions?: string[] | null;
  allowedIp?: string | null;
  iat?: number;
  exp?: number;
}

/**
 * Deterministic secure password hashing
 */
export function hashPassword(password: string): string {
  return crypto
    .pbkdf2Sync(password.trim(), PASSWORD_SALT, 1000, 32, "sha256")
    .toString("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  if (!password || !hash) return false;
  const computed = hashPassword(password);
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
}

/**
 * Robust Client IP Extractor
 * Handles LAN IPs, proxies, load balancers, and IPv6 normalization.
 */
export function getClientIp(req: Request | any): string {
  if (!req) return "127.0.0.1";

  const forwarded = req.headers?.["x-forwarded-for"];
  let ip = "";

  if (typeof forwarded === "string") {
    ip = forwarded.split(",")[0].trim();
  } else if (Array.isArray(forwarded) && forwarded.length > 0) {
    ip = forwarded[0].trim();
  } else if (req.headers?.["cf-connecting-ip"]) {
    ip = String(req.headers["cf-connecting-ip"]).trim();
  } else if (req.headers?.["x-real-ip"]) {
    ip = String(req.headers["x-real-ip"]).trim();
  } else if (req.socket?.remoteAddress) {
    ip = req.socket.remoteAddress;
  } else if (req.ip) {
    ip = req.ip;
  }

  // Normalize IPv6-mapped IPv4 e.g. ::ffff:192.168.1.100 -> 192.168.1.100
  if (ip.startsWith("::ffff:")) {
    ip = ip.substring(7);
  }

  if (ip === "::1" || ip === "localhost" || !ip) {
    ip = "127.0.0.1";
  }

  return ip;
}

/**
 * Validate staff login IP
 * Admin role is completely exempt from IP checks.
 * Non-admin roles (cashier, kitchen, waiter) must match allowedIp if specified.
 */
export function validateStaffIp(
  staff: { role: string; allowedIp?: string | null },
  clientIp: string
): { valid: boolean; reason?: string } {
  // 1. In development environment, IP restriction is disabled for easy testing
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    return { valid: true };
  }

  // 2. Admin is always exempt from IP restrictions
  if (staff.role === "admin") {
    return { valid: true };
  }

  const allowed = staff.allowedIp?.trim();
  // If no IP is locked yet, or wildcard '*', allow login
  if (!allowed || allowed === "*" || allowed === "any") {
    return { valid: true };
  }

  const allowedList = allowed.split(",").map((s) => s.trim());
  const normalizedClient = clientIp.trim();

  // Allow match on exact IP, or if both are localhost variants
  const isMatch =
    allowedList.includes(normalizedClient) ||
    (allowedList.includes("127.0.0.1") && normalizedClient === "localhost") ||
    (allowedList.includes("localhost") && normalizedClient === "127.0.0.1");

  if (!isMatch) {
    return {
      valid: false,
      reason: `Account is bound to terminal IP: ${allowed}. Current device IP is ${clientIp}. Please contact Admin to update allowed device IP.`,
    };
  }

  return { valid: true };
}

/**
 * Generate 24-Hour Signed JWT Session Token
 */
export async function generateStaffToken(
  payload: StaffTokenPayload,
  expiresInSeconds: number = TOKEN_LIFETIME_SECONDS
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    staffId: payload.staffId,
    name: payload.name,
    email: payload.email,
    role: payload.role,
    stationName: payload.stationName || null,
    assignedCashierId: payload.assignedCashierId || null,
    permissions: payload.permissions || null,
    allowedIp: payload.allowedIp || null,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresInSeconds)
    .sign(AUTH_SECRET);
}

/**
 * Verify and decode JWT Session Token
 */
export async function verifyStaffToken(
  token: string | undefined | null
): Promise<StaffTokenPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, AUTH_SECRET, {
      algorithms: ["HS256"],
    });
    if (!payload.staffId || !payload.role) {
      return null;
    }
    return {
      staffId: Number(payload.staffId),
      name: String(payload.name || ""),
      email: String(payload.email || ""),
      role: payload.role as StaffTokenPayload["role"],
      stationName: (payload.stationName as string) || null,
      assignedCashierId: payload.assignedCashierId ? Number(payload.assignedCashierId) : null,
      permissions: (payload.permissions as string[]) || null,
      allowedIp: (payload.allowedIp as string) || null,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

/**
 * Detects if the token is in the 2-Hour Sliding Refresh Window
 * (i.e. remaining time <= 2 hours and hasn't expired yet)
 */
export function isWithinSlidingRefreshWindow(
  expSeconds?: number,
  windowSeconds = REFRESH_WINDOW_SECONDS
): boolean {
  if (!expSeconds) return false;
  const now = Math.floor(Date.now() / 1000);
  const remaining = expSeconds - now;
  return remaining > 0 && remaining <= windowSeconds;
}

/**
 * Set HTTP-Only Session Cookie
 */
export function setStaffSessionCookie(
  res: Response,
  token: string,
  maxAgeSeconds: number = TOKEN_LIFETIME_SECONDS
) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie(STAFF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds * 1000,
  });
}

/**
 * Clear Session Cookie
 */
export function clearStaffSessionCookie(res: Response) {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie(STAFF_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
  });
}
