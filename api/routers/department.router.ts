import { dashboardProcedure, router } from "../lib/trpc";
import { getDb } from "../db";
import { departments } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

export const departmentRouter = router({
  // Create a new department
  createDepartment: dashboardProcedure
    .input(
      z.object({
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = db
        .insert(departments)
        .values({ name: input.name })
        .run();
      return { id: Number(result.lastInsertRowid) };
    }),

  // Get list of departments
  getDepartments: dashboardProcedure.query(async () => {
    const db = getDb();
    return db.select().from(departments).orderBy(desc(departments.createdAt)).all();
  }),

  // Update a department
  updateDepartment: dashboardProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      db.update(departments).set({ name: input.name }).where(eq(departments.id, input.id)).run();
      return { success: true };
    }),

  // Delete a department
  deleteDepartment: dashboardProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      db.delete(departments).where(eq(departments.id, input.id)).run();
      return { success: true };
    }),
});
