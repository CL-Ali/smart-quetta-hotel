export const VISIT_STATUSES = [
  "created",
  "open",
  "payment_pending",
  "closed",
  "archived",
] as const;
export const GUEST_STATUSES = [
  "pending",
  "active",
  "resumed",
  "inactive",
] as const;
export const ORDER_STATUSES = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "served",
  "completed",
] as const;
export const INVOICE_STATUSES = [
  "draft",
  "issued",
  "paid",
  "cancelled",
] as const;
export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "refunded",
  "cancelled",
] as const;

export type VisitStatus = (typeof VISIT_STATUSES)[number];
export type GuestStatus = (typeof GUEST_STATUSES)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export function isOpenVisitStatus(status: string | null | undefined) {
  return status === "open";
}

export function isBillableInvoiceStatus(status: string | null | undefined) {
  return status === "draft" || status === "issued";
}

export function isClosedVisitStatus(status: string | null | undefined) {
  return status === "closed";
}

export function normalizeKitchenStatus(
  status: string | null | undefined
): OrderStatus {
  switch (status) {
    case "accepted":
    case "preparing":
    case "ready":
    case "served":
    case "completed":
      return status;
    default:
      return "pending";
  }
}

export function normalizeOrderStatus(
  status: string | null | undefined
): OrderStatus {
  switch (status) {
    case "accepted":
    case "preparing":
    case "ready":
    case "served":
    case "completed":
      return status;
    default:
      return "pending";
  }
}

export function getOrderEventName(status: OrderStatus) {
  switch (status) {
    case "preparing":
      return "OrderPreparing";
    case "ready":
      return "OrderReady";
    case "served":
      return "OrderServed";
    case "completed":
      return "OrderCompleted";
    default:
      return "OrderAccepted";
  }
}

export function calculateSubtotal(
  items: Array<{ quantity: number; unitPrice: number }>
) {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

export function settleBalance(total: number, paidAmount: number) {
  const balance = Math.max(0, total - paidAmount);
  return {
    paidAmount,
    balance,
    status: balance === 0 ? "paid" : "issued",
  } as const;
}

export function deriveKitchenOrderStatus(
  items: Array<{
    quantity: number;
    kitchenStatus: string | null | undefined;
    servedQty: number | null | undefined;
  }>
) {
  const allServed = items.every(item => (item.servedQty ?? 0) >= item.quantity);
  const anyCompleted = items.some(item => item.kitchenStatus === "completed");
  const anyReady = items.some(item => item.kitchenStatus === "ready");
  const anyPreparing = items.some(item => item.kitchenStatus === "preparing");
  const anyAccepted = items.some(item => item.kitchenStatus === "accepted");

  if (allServed || anyCompleted) return "completed" as const;
  if (anyReady) return "ready" as const;
  if (anyPreparing) return "preparing" as const;
  if (anyAccepted) return "accepted" as const;
  return "pending" as const;
}

export function ensureOpenVisit<T extends { status?: string | null }>(
  visit: T | null | undefined
) {
  if (!visit) {
    throw new Error("Visit not found");
  }

  if (!isOpenVisitStatus(visit.status)) {
    throw new Error("Visit is not open");
  }

  return visit;
}

export function ensureVisitCanBeClosed<T extends { status?: string | null }>(
  visit: T | null | undefined
) {
  if (!visit) {
    throw new Error("Visit not found");
  }

  if (!(visit.status === "open" || visit.status === "payment_pending")) {
    throw new Error("Visit cannot be closed");
  }

  return visit;
}

export function ensureInvoiceCanReceivePayment<
  T extends { status?: string | null },
>(invoice: T | null | undefined) {
  if (!invoice) {
    throw new Error("Invoice not found");
  }

  if (invoice.status === "cancelled") {
    throw new Error("Invoice is cancelled");
  }

  if (invoice.status === "paid") {
    throw new Error("Invoice is already paid");
  }

  return invoice;
}

export function ensureSingleActiveInvoice<T extends { status?: string | null }>(
  invoices: T[]
) {
  const activeInvoice = invoices.find(
    invoice => invoice.status !== "cancelled"
  );
  if (activeInvoice) {
    throw new Error("Invoice already exists for visit");
  }
}
