import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "@shared/const";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Requires any logged in staff member
export const staffProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (ctx.staff) {
      return next({ ctx: { ...ctx, staff: ctx.staff } });
    }

    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Staff authentication required. Please login.",
    });
  })
);

// Admin-only procedure (Master Accounts, Staff Management, Financials)
export const adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (ctx.staff && ctx.staff.role === "admin") {
      return next({ ctx: { ...ctx, staff: ctx.staff } });
    }

    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin permission required (10002).",
    });
  })
);

// Cashier procedure: Accessible by Admin and Cashier
export const cashierProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (ctx.staff && (ctx.staff.role === "admin" || ctx.staff.role === "cashier")) {
      return next({ ctx: { ...ctx, staff: ctx.staff } });
    }

    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Cashier or Admin access required.",
    });
  })
);

// Kitchen procedure: Accessible by Admin, Cashier, and Kitchen
export const kitchenProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (
      ctx.staff &&
      (ctx.staff.role === "admin" ||
        ctx.staff.role === "cashier" ||
        ctx.staff.role === "kitchen")
    ) {
      return next({ ctx: { ...ctx, staff: ctx.staff } });
    }

    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Kitchen access required.",
    });
  })
);

// Waiter procedure: Accessible by Admin, Cashier, Kitchen, and Waiter (All Staff)
export const waiterProcedure = staffProcedure;

// Dashboard procedure: Accessible by Cashier and Admin
export const dashboardProcedure = cashierProcedure;

export const protectedProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.staff) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    return next({ ctx });
  })
);
