export type DomainCommandName =
  | "CreateGuest"
  | "OpenVisit"
  | "CloseVisit"
  | "CreateOrder"
  | "UpdateOrder"
  | "GenerateInvoice"
  | "ReceivePayment"
  | "UpdateKitchenStatus";

export type DomainEventName =
  | "GuestCreated"
  | "VisitOpened"
  | "OrderCreated"
  | "OrderAccepted"
  | "OrderPreparing"
  | "OrderReady"
  | "OrderServed"
  | "OrderCompleted"
  | "InvoiceGenerated"
  | "PaymentReceived"
  | "VisitClosed";

export type DomainEvent = {
  id: string;
  entityId: number;
  entityType: "guest" | "visit" | "order" | "invoice" | "payment";
  occurredAt: string;
  actorId?: number;
  payload: Record<string, unknown>;
  name: DomainEventName;
};

export type DomainCommandResult<T> = {
  command: {
    name: DomainCommandName;
    occurredAt: string;
  };
  events: DomainEvent[];
  data: T;
};
