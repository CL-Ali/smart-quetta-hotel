import { guestRouter } from "./guest.router";
import { visitRouter } from "./visit.router";
import { systemRouter } from "./systemRouter";
import { router } from "../lib/trpc";
import { hotelRouter } from "./hotelRouter";
import { invoiceRouter } from "./invoice.router";
import { paymentRouter } from "./payment.router";
import { orderRouter } from "./order.router";
import { kitchenRouter } from "./kitchen.router";
import { productRouter } from "./product.router";
import { departmentRouter } from "./department.router";
import { authRouter } from "./auth.router";
import { adminRouter } from "./admin.router";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  admin: adminRouter,
  guest: guestRouter,
  visit: visitRouter,
  order: orderRouter,
  invoice: invoiceRouter,
  payment: paymentRouter,
  kitchen: kitchenRouter,
  product: productRouter,
  department: departmentRouter,
  hotel: hotelRouter,
});

export type AppRouter = typeof appRouter;
