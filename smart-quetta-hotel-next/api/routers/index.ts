import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../lib/cookies";
import { guestRouter } from "./guest.router";
import { visitRouter } from "./visit.router";
import { systemRouter } from "./systemRouter";
import { publicProcedure, router } from "../lib/trpc";
import { hotelRouter } from "./hotelRouter";
import { invoiceRouter } from "./invoice.router";
import { paymentRouter } from "./payment.router";
import { orderRouter } from "./order.router";
import { kitchenRouter } from "./kitchen.router";
import { productRouter } from "./product.router";
import { departmentRouter } from "./department.router";

export const appRouter = router({
  system: systemRouter,
  guest: guestRouter,
  visit: visitRouter,
  order: orderRouter,
  invoice: invoiceRouter,
  payment: paymentRouter,
  kitchen: kitchenRouter,
  product: productRouter,
    department: departmentRouter,
    hotel: hotelRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
