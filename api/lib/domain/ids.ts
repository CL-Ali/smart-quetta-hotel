import { randomUUID } from "crypto";

export function createGuestUuid() {
  return randomUUID();
}

export function createVisitTicket(visitId: number) {
  return `VIS-${visitId}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function createInvoiceNo(invoiceId: number) {
  return `INV-${invoiceId}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function createReceiptNo(receiptId: number) {
  return `RCT-${receiptId}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
