import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import type { DomainEventName } from "./domain/types";

// ── Socket event name mapping ────────────────────────────────────────────────
// Maps domain event names (past-tense, PascalCase from 018-event-catalog.md)
// to the socket wire names (dot-notation, lowercase from 006-realtime.md).
// Define once here so every router imports from this file — no string literals
// scattered across routers.

export const SOCKET_EVENT: Record<DomainEventName, string> = {
  GuestCreated:      "guest.created",
  VisitOpened:       "visit.opened",
  VisitClosed:       "visit.closed",
  OrderCreated:      "order.created",
  OrderAccepted:     "order.updated",
  OrderPreparing:    "order.updated",
  OrderReady:        "kitchen.ready",
  OrderServed:       "order.updated",
  OrderCompleted:    "order.updated",
  InvoiceGenerated:  "invoice.generated",
  PaymentReceived:   "payment.received",
} as const;

// ── Singleton ────────────────────────────────────────────────────────────────

let io: Server | null = null;

/**
 * Called once at server startup in api/index.ts.
 * Attaches Socket.io to the existing HTTP server — no new port required.
 */
export function initIo(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      // Allow the Vite dev server origin and same-origin production requests.
      origin: "*",
      methods: ["GET", "POST"],
    },
    // Keep the path distinct from tRPC to avoid collisions.
    path: "/ws/",
  });

  io.on("connection", socket => {
    // Intentionally minimal — server pushes only, clients do not send commands
    // over the socket. All mutations go through tRPC.
    socket.on("disconnect", () => {
      // no-op; cleanup is automatic
    });
  });

  return io;
}

/**
 * Returns the Socket.io server instance, or null if not yet initialised.
 * Routers call getIo()?.emit(...) so tests and CLI runs never crash.
 */
export function getIo(): Server | null {
  return io;
}
