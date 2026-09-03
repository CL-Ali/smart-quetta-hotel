import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "@shared/const";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { ENV } from "./env";
const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

/**
 * Interim dashboard procedure — checks X-Dashboard-Pin header against
 * DASHBOARD_PIN env var (raw string comparison).
 *
 * Frontend stores a base64-encoded PIN in localStorage (not plaintext),
 * decodes it before sending in the header, so the wire value is the raw PIN.
 *
 * Phase 6: replace with protectedProcedure + per-staff OAuth tokens.
 */
export const dashboardProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    const incoming = (ctx.req.headers["x-dashboard-pin"] as string | undefined)?.trim() ?? "";

    if (!incoming || incoming !== ENV.dashboardPin) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Dashboard PIN required",
      });
    }

    return next({ ctx });
  }),
);
