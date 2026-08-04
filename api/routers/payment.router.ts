import { z } from "zod";
import { eq } from "drizzle-orm";
import { publicProcedure, router } from "../lib/trpc";
import { getDb } from "../db";
import { invoices, payments, receipts } from "../db/schema";
import {
  createDomainEvent,
  createReceiptNo,
  ensureInvoiceCanReceivePayment,
  findInvoiceById,
  settleBalance,
  type DomainCommandResult,
} from "../lib/domain";
import { getIo, SOCKET_EVENT } from "../lib/socket";

const receivePaymentInput = z.object({
  invoiceId: z.number(),
  amount: z.number().positive(),
  method: z.enum(["cash", "bank"]),
  reference: z.string().optional(),
});

export const paymentRouter = router({
  receivePayment: publicProcedure
    .input(receivePaymentInput)
    .mutation(async ({ input }): Promise<DomainCommandResult<any>> => {
      const db = getDb();
      const invoice = ensureInvoiceCanReceivePayment(
        findInvoiceById(db, input.invoiceId)
      );

      const nextPaidAmount = (invoice.paidAmount ?? 0) + input.amount;
      if (nextPaidAmount > (invoice.total ?? 0)) {
        throw new Error("Payment exceeds outstanding balance");
      }

      const insertedPayment = db
        .insert(payments)
        .values({
          invoiceId: input.invoiceId,
          amount: input.amount,
          method: input.method,
          status: "completed",
          reference: input.reference ?? null,
          receivedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        })
        .returning()
        .all()[0];

      const settlement = settleBalance(invoice.total ?? 0, nextPaidAmount);

      db.update(invoices)
        .set(settlement)
        .where(eq(invoices.id, input.invoiceId))
        .run();

      const insertedReceipt = db
        .insert(receipts)
        .values({
          invoiceId: input.invoiceId,
          receiptNo: createReceiptNo(insertedPayment.id),
          issuedAt: new Date().toISOString(),
          summary: JSON.stringify({
            invoiceId: input.invoiceId,
            amount: input.amount,
            method: input.method,
          }),
          qrCodeData: null,
        })
        .returning()
        .all()[0];

      const paymentResult: DomainCommandResult<any> = {
        command: {
          name: "ReceivePayment",
          occurredAt: new Date().toISOString(),
        },
        events: [
          createDomainEvent({
            name: "PaymentReceived",
            entityId: insertedPayment.id,
            entityType: "payment",
            payload: {
              invoiceId: input.invoiceId,
              receiptNo: insertedReceipt.receiptNo,
            },
          }),
        ],
        data: {
          payment: insertedPayment,
          receipt: insertedReceipt,
          invoice: { ...invoice, ...settlement },
        },
      };

      getIo()?.emit(SOCKET_EVENT.PaymentReceived, {
        invoiceId: input.invoiceId,
        paymentId: insertedPayment.id,
        amount: input.amount,
        receiptNo: insertedReceipt.receiptNo,
      });
      return paymentResult;
    }),
});
