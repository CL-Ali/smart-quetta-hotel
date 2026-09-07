import type { Server as HttpServer } from "http";

import { Server } from "socket.io";

import type { DomainEventName } from "./domain/types";

// --------------------------------------------------
// Socket event name mapping
// --------------------------------------------------

export const SOCKET_EVENT: Record<
  DomainEventName,
  string
> = {
  GuestCreated: "guest.created",
  VisitOpened: "visit.opened",
  VisitClosed: "visit.closed",

  OrderCreated: "order.created",
  OrderAccepted: "order.updated",
  OrderPreparing: "order.updated",
  OrderReady: "kitchen.ready",
  OrderServed: "order.updated",
  OrderCompleted: "order.updated",

  InvoiceGenerated: "invoice.generated",
  PaymentReceived: "payment.received",
} as const;

// --------------------------------------------------
// Singleton
// --------------------------------------------------

let io: Server | null = null;

/**
 * Initialize Socket.IO on the existing HTTP server.
 *
 * Socket.IO uses the same server as:
 *
 * - Express
 * - Next.js
 *
 * No additional port is required.
 */
export function initIo(
  httpServer: HttpServer
): Server {

  // this is io new 

  io = new Server(httpServer, {
    path: "/ws/",
    transports: ["websocket"],
    cors: {
      origin: true,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(
      `[Socket.IO] Client connected: ${socket.id}`
    );

    socket.on("disconnect", (reason) => {
      console.log(
        `[Socket.IO] Client disconnected: ${socket.id} (${reason})`
      );
    });
  });

  console.log(
    "[Socket.IO] Initialized on /ws/"
  );

  return io;
}

/**
 * Get the Socket.IO instance.
 *
 * Routers can safely call:
 *
 * getIo()?.emit(...)
 */
export function getIo(): Server | null {
  return io;
}