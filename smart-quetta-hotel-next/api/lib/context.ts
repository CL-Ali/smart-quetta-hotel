import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { parse as parseCookie } from "cookie";
import {
  STAFF_COOKIE_NAME,
  verifyStaffToken,
  generateStaffToken,
  isWithinSlidingRefreshWindow,
  setStaffSessionCookie,
  getClientIp,
  type StaffTokenPayload,
} from "./auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  staff: StaffTokenPayload | null;
  clientIp: string;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let staff: StaffTokenPayload | null = null;
  const clientIp = getClientIp(opts.req);

  // Staff Authentication & 2-Hour Sliding Window Auto-Refresh
  try {
    const cookieHeader = opts.req.headers.cookie;
    const cookies = cookieHeader ? parseCookie(cookieHeader) : {};
    let token = cookies[STAFF_COOKIE_NAME];

    // Fallback to Authorization: Bearer <token>
    if (!token && opts.req.headers.authorization) {
      const authHeader = opts.req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7).trim();
      }
    }

    if (token) {
      staff = await verifyStaffToken(token);

      // Auto-refresh sliding window: if staff is active and within last 2 hours of expiry
      if (staff && isWithinSlidingRefreshWindow(staff.exp)) {
        try {
          const refreshedToken = await generateStaffToken(staff);
          setStaffSessionCookie(opts.res, refreshedToken);
          opts.res.setHeader("x-refreshed-token", refreshedToken);
        } catch (refreshErr) {
          console.warn("[Auth] Sliding refresh error:", refreshErr);
        }
      }
    }
  } catch {
    staff = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    staff,
    clientIp,
  };
}
