import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../lib/cookies";
import { systemRouter } from "./systemRouter";
import { publicProcedure, router } from "../lib/trpc";
import { hotelRouter } from "./hotelRouter";

export const appRouter = router({
  system: systemRouter,
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
