import { dashboardProcedure, router } from "../lib/trpc";
import { getDb } from "../db";
import { menuItems, departments } from "../db/schema";
import { eq, and, or, like, desc } from "drizzle-orm";
import { z } from "zod";

export const productRouter = router({
  // Create a new menu item (product)
  createProduct: dashboardProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.number().positive(),
        category: z.string().optional(),
        imageUrl: z.string().optional(),
        departmentId: z.number(),
        isAvailable: z.boolean().optional().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db
        .insert(menuItems)
        .values({
          name: input.name,
          description: input.description ?? null,
          price: input.price,
          category: input.category ?? null,
          imageUrl: input.imageUrl ?? null,
          departmentId: input.departmentId,
          isAvailable: input.isAvailable,
        })
        .run();
      return { id: Number(result.lastInsertRowid) };
    }),

  // Retrieve list of products, with optional search across name, category, department name
  getProducts: dashboardProcedure
    .input(
      z.object({
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const baseQuery = db
        .select({
          id: menuItems.id,
          name: menuItems.name,
          description: menuItems.description,
          price: menuItems.price,
          category: menuItems.category,
          imageUrl: menuItems.imageUrl,
          isAvailable: menuItems.isAvailable,
          departmentId: menuItems.departmentId,
          departmentName: departments.name,
        })
        .from(menuItems)
        .leftJoin(departments, eq(menuItems.departmentId, departments.id));

      if (input.search && input.search.trim() !== "") {
        const term = `%${input.search.trim().toLowerCase()}%`;
        return baseQuery
          .where(
            or(
              like(menuItems.name, term),
              like(menuItems.category, term),
              like(departments.name, term)
            )
          )
          .orderBy(desc(menuItems.createdAt))
          .all();
      }

      return baseQuery.orderBy(desc(menuItems.createdAt)).all();
    }),

  // Update an existing product
  updateProduct: dashboardProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        price: z.number().positive().optional(),
        category: z.string().optional(),
        imageUrl: z.string().optional(),
        departmentId: z.number().optional(),
        isAvailable: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...fields } = input;
      const db = getDb();
      const updates: any = { ...fields };
      // Convert boolean to int for SQLite
      // Preserve boolean value for SQLite boolean column
      if (typeof fields.isAvailable === "boolean") {
        updates.isAvailable = fields.isAvailable;
      }
      db.update(menuItems).set(updates).where(eq(menuItems.id, id)).run();
      return { success: true };
    }),

  // Delete a product
  deleteProduct: dashboardProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      db.delete(menuItems).where(eq(menuItems.id, input.id)).run();
      return { success: true };
    }),
});
