import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { publicProcedure, router } from "../lib/trpc";
import { getDb } from "../db";
import { staff } from "../db/schema";
import {
  verifyPassword,
  validateStaffIp,
  generateStaffToken,
  setStaffSessionCookie,
  clearStaffSessionCookie,
} from "../lib/auth";

export const authRouter = router({
  login: publicProcedure
    .input(
      z.object({
        emailOrUsername: z.string().min(1, "Username or email is required"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const staffList = db
        .select()
        .from(staff)
        .where(eq(staff.email, input.emailOrUsername.trim()))
        .all();

      const member = staffList[0];
      if (!member || !member.isActive) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid username or password.",
        });
      }

      // Check password hash
      const isValidPass = verifyPassword(input.password, member.passwordHash);
      if (!isValidPass) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid username or password.",
        });
      }

      // Check IP Binding
      const ipCheck = validateStaffIp(member, ctx.clientIp);
      if (!ipCheck.valid) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            ipCheck.reason ||
            "Access denied: Your device IP does not match the registered terminal IP.",
        });
      }

      // Update last login & current IP
      const nowIso = new Date().toISOString();
      try {
        db.update(staff)
          .set({
            lastLoginAt: nowIso,
            currentIp: ctx.clientIp,
            updatedAt: nowIso,
          })
          .where(eq(staff.id, member.id))
          .run();
      } catch (err) {
        console.warn("[Auth] Failed to update login metadata:", err);
      }

      // Parse permissions if stored
      let parsedPerms: string[] = [];
      if (member.permissions) {
        try {
          parsedPerms = JSON.parse(member.permissions);
        } catch {
          parsedPerms = member.permissions.split(",").map((s) => s.trim());
        }
      }

      let parsedCashierIds: number[] = [];
      if (member.assignedCashierIds) {
        try {
          parsedCashierIds = JSON.parse(member.assignedCashierIds);
        } catch {
          parsedCashierIds = member.assignedCashierIds.split(",").map((s) => Number(s.trim())).filter(Boolean);
        }
      }

      // Issue 24-hour JWT token
      const tokenPayload = {
        staffId: member.id,
        name: member.name,
        email: member.email,
        role: member.role as any,
        stationName: member.stationName || null,
        assignedCashierIds: parsedCashierIds.length > 0 ? parsedCashierIds : null,
        permissions: parsedPerms,
        allowedIp: member.allowedIp,
      };

      const token = await generateStaffToken(tokenPayload);
      setStaffSessionCookie(ctx.res, token);

      return {
        success: true,
        token,
        clientIp: ctx.clientIp,
        staff: {
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          stationName: member.stationName || null,
          assignedCashierIds: parsedCashierIds,
          permissions: parsedPerms,
          allowedIp: member.allowedIp,
          currentIp: ctx.clientIp,
        },
      };
    }),

  me: publicProcedure.query(async ({ ctx }) => {
    const userPerms = ctx.staff?.permissions || [];
    const hasExplicitPerms = Array.isArray(userPerms) && userPerms.length > 0;
    const role = ctx.staff?.role;

    const canAdmin = hasExplicitPerms
      ? userPerms.includes("can_access_admin")
      : role === "admin";
    const canCashier = hasExplicitPerms
      ? userPerms.includes("can_access_cashier")
      : role === "admin" || role === "cashier";
    const canPos = hasExplicitPerms
      ? userPerms.includes("can_access_pos")
      : role === "admin" || role === "cashier" || role === "waiter";
    const canKitchen = hasExplicitPerms
      ? userPerms.includes("can_access_kitchen")
      : role === "admin" || role === "kitchen";
    const canWaiter = hasExplicitPerms
      ? userPerms.includes("can_access_waiter")
      : role === "admin" || role === "waiter";
    const canDiscount = hasExplicitPerms
      ? userPerms.includes("can_discount")
      : role === "admin" || role === "cashier";
    const canSettleKhata = hasExplicitPerms
      ? userPerms.includes("can_settle_khata")
      : role === "admin" || role === "cashier";
    const canVoidOrder = hasExplicitPerms
      ? userPerms.includes("can_void_order")
      : role === "admin";
    const canViewReports = hasExplicitPerms
      ? userPerms.includes("can_view_reports")
      : role === "admin";

    return {
      isAuthenticated: !!ctx.staff,
      staff: ctx.staff,
      clientIp: ctx.clientIp,
      permissions: {
        canAdmin,
        canCashier,
        canPos,
        canKitchen,
        canWaiter,
        canDiscount,
        canSettleKhata,
        canVoidOrder,
        canViewReports,
        customPermissions: userPerms,
      },
    };
  }),

  refresh: publicProcedure.mutation(async ({ ctx }) => {
    if (!ctx.staff) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    const token = await generateStaffToken(ctx.staff);
    setStaffSessionCookie(ctx.res, token);

    return {
      success: true,
      token,
      staff: ctx.staff,
      clientIp: ctx.clientIp,
    };
  }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    clearStaffSessionCookie(ctx.res);
    return { success: true };
  }),
});
