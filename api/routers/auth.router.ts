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

      // Issue 24-hour JWT token
      const tokenPayload = {
        staffId: member.id,
        name: member.name,
        email: member.email,
        role: member.role as any,
        stationName: member.stationName || null,
        assignedCashierId: member.assignedCashierId ? Number(member.assignedCashierId) : null,
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
          assignedCashierId: member.assignedCashierId ? Number(member.assignedCashierId) : null,
          permissions: parsedPerms,
          allowedIp: member.allowedIp,
          currentIp: ctx.clientIp,
        },
      };
    }),

  me: publicProcedure.query(async ({ ctx }) => {
    const userPerms = ctx.staff?.permissions || [];
    return {
      isAuthenticated: !!ctx.staff,
      staff: ctx.staff,
      clientIp: ctx.clientIp,
      permissions: {
        canAdmin: ctx.staff?.role === "admin",
        canCashier:
          ctx.staff?.role === "admin" ||
          ctx.staff?.role === "cashier" ||
          userPerms.includes("can_access_cashier"),
        canKitchen:
          ctx.staff?.role === "admin" ||
          ctx.staff?.role === "cashier" ||
          ctx.staff?.role === "kitchen" ||
          userPerms.includes("can_access_kitchen"),
        canWaiter: !!ctx.staff || userPerms.includes("can_access_waiter"),
        canDiscount:
          ctx.staff?.role === "admin" ||
          userPerms.includes("can_discount") ||
          ctx.staff?.role === "cashier",
        canSettleKhata:
          ctx.staff?.role === "admin" ||
          userPerms.includes("can_settle_khata") ||
          ctx.staff?.role === "cashier",
        canVoidOrder:
          ctx.staff?.role === "admin" || userPerms.includes("can_void_order"),
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
