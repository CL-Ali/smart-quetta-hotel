import { desc, eq, inArray } from "drizzle-orm";
import type { getDb } from "../../db";
import {
  guests,
  invoices,
  menuItems,
  orderItems,
  orders,
  payments,
  receipts,
  visits,
} from "../../db/schema";

type Db = ReturnType<typeof getDb>;

export function findGuestById(db: Db, guestId: number) {
  return db.select().from(guests).where(eq(guests.id, guestId)).all()[0];
}

export function findGuestByName(db: Db, name: string) {
  return db.select().from(guests).where(eq(guests.name, name)).all()[0];
}

export function findVisitById(db: Db, visitId: number) {
  return db.select().from(visits).where(eq(visits.id, visitId)).all()[0];
}

export function findOrderById(db: Db, orderId: number) {
  return db.select().from(orders).where(eq(orders.id, orderId)).all()[0];
}

export function findMenuItemById(db: Db, menuItemId: number) {
  return db
    .select()
    .from(menuItems)
    .where(eq(menuItems.id, menuItemId))
    .all()[0];
}

export function findInvoiceById(db: Db, invoiceId: number) {
  return db.select().from(invoices).where(eq(invoices.id, invoiceId)).all()[0];
}

export function listInvoicesForVisit(db: Db, visitId: number) {
  return db.select().from(invoices).where(eq(invoices.visitId, visitId)).all();
}

export function listOrdersForVisit(db: Db, visitId: number) {
  return db.select().from(orders).where(eq(orders.visitId, visitId)).all();
}

export function listOrderItemsForOrderIds(db: Db, orderIds: number[]) {
  if (orderIds.length === 0) return [];
  return db
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderIds))
    .all();
}

export function listOrderItemsWithMenuForOrder(db: Db, orderId: number) {
  return db
    .select({
      id: orderItems.id,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      name: menuItems.name,
      price: menuItems.price,
      kitchenStatus: orderItems.kitchenStatus,
      servedQty: orderItems.servedQty,
    })
    .from(orderItems)
    .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
    .where(eq(orderItems.orderId, orderId))
    .all();
}

export function listPaymentsForInvoice(db: Db, invoiceId: number) {
  return db
    .select()
    .from(payments)
    .where(eq(payments.invoiceId, invoiceId))
    .all();
}

export function listReceiptsForInvoice(db: Db, invoiceId: number) {
  return db
    .select()
    .from(receipts)
    .where(eq(receipts.invoiceId, invoiceId))
    .all();
}

export function getInvoiceBundle(db: Db, invoiceId: number) {
  const invoice = findInvoiceById(db, invoiceId);
  if (!invoice) {
    throw new Error("Invoice not found");
  }

  return {
    invoice,
    payments: listPaymentsForInvoice(db, invoiceId),
    receipts: listReceiptsForInvoice(db, invoiceId),
  };
}
