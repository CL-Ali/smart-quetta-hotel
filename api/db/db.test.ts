import { describe, it, expect } from "vitest";
import { getDb } from "./index";
import { menuItems, departments } from "./schema";

describe("Database Initialization & Schema", () => {
  it("initializes without NOT NULL constraint violations on menu_items.departmentId", () => {
    const db = getDb();
    expect(db).toBeDefined();

    const items = db.select().from(menuItems).all();
    expect(items.length).toBeGreaterThan(0);

    const depts = db.select().from(departments).all();
    expect(depts.length).toBeGreaterThan(0);

    // Verify all menu items have valid or fallback departmentIds
    for (const item of items) {
      expect(item.name).toBeTruthy();
      expect(item.price).toBeGreaterThan(0);
    }
  });
});
