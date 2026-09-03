import { randomUUID, randomBytes } from "crypto";

export function createGuestUuid() {
  return randomUUID();
}

/**
 * Generates a visit recovery ticket.
 * Format: VIS-{visitId}-{12 uppercase hex chars}
 * Entropy: 6 random bytes = 48 bits — not brute-forceable at scale.
 * NOTE: rate-limiting on resumeVisit is deferred to Phase 6 (needs real log data first).
 */
export function createVisitTicket(visitId: number) {
  return `VIS-${visitId}-${randomBytes(6).toString("hex").toUpperCase()}`;
}

export function createInvoiceNo(invoiceId: number) {
  return `INV-${invoiceId}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function createReceiptNo(receiptId: number) {
  return `RCT-${receiptId}-${randomBytes(4).toString("hex").toUpperCase()}`;
}
