import { z } from "zod";
import { eq } from "drizzle-orm";
import { publicProcedure, router } from "../lib/trpc";
import { getDb } from "../db";
import { invoices } from "../db/schema";
import {
  createDomainEvent,
  createInvoiceNo,
  calculateSubtotal,
  ensureSingleActiveInvoice,
  findVisitById,
  getInvoiceBundle,
  listInvoicesForVisit,
  listOrderItemsForOrderIds,
  listOrdersForVisit,
  type DomainCommandResult,
} from "../lib/domain";
import { getIo, SOCKET_EVENT } from "../lib/socket";

const invoiceInput = z.object({ visitId: z.number() });

export const invoiceRouter = router({
  generateInvoice: publicProcedure
    .input(invoiceInput)
    .mutation(async ({ input }): Promise<DomainCommandResult<any>> => {
      const db = getDb();
      const visit = findVisitById(db, input.visitId);
      if (!visit) throw new Error("Visit not found");

      ensureSingleActiveInvoice(listInvoicesForVisit(db, input.visitId));

      const relatedOrders = listOrdersForVisit(db, input.visitId);
      const orderIds = relatedOrders.map(order => order.id);
      const relatedItems = listOrderItemsForOrderIds(db, orderIds);
      if (relatedItems.length === 0) {
        throw new Error("No billable order lines found");
      }

      const subtotal = calculateSubtotal(relatedItems);
      const tax = 0;
      const discount = 0;
      const total = subtotal + tax - discount;

      const inserted = db
        .insert(invoices)
        .values({
          visitId: input.visitId,
          invoiceNo: createInvoiceNo(Date.now()),
          subtotal,
          tax,
          discount,
          total,
          paidAmount: 0,
          balance: total,
          status: "issued",
          generatedAt: new Date().toISOString(),
        })
        .returning()
        .all()[0];

      const invoiceResult: DomainCommandResult<any> = {
        command: {
          name: "GenerateInvoice",
          occurredAt: new Date().toISOString(),
        },
        events: [
          createDomainEvent({
            name: "InvoiceGenerated",
            entityId: inserted.id,
            entityType: "invoice",
            payload: { visitId: input.visitId },
          }),
        ],
        data: inserted,
      };

      getIo()?.emit(SOCKET_EVENT.InvoiceGenerated, {
        invoiceId: inserted.id,
        visitId: input.visitId,
        total: inserted.total,
      });
      return invoiceResult;
    }),

  getInvoice: publicProcedure
    .input(z.object({ invoiceId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const { invoice, payments, receipts } = getInvoiceBundle(
        db,
        input.invoiceId
      );
      return {
        invoice,
        payments,
        receipts,
        balance: invoice.balance,
      };
    }),
});
