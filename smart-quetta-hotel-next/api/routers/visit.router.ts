import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { publicProcedure, router } from "../lib/trpc";
import { getDb } from "../db";
import { browserSessions, visits } from "../db/schema";
import {
  createDomainEvent,
  createVisitTicket,
  ensureVisitCanBeClosed,
  findGuestById,
  findVisitById,
  type DomainCommandResult,
} from "../lib/domain";
import { getIo, SOCKET_EVENT } from "../lib/socket";

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * Write a BrowserSession row that ties a device to a specific guest + visit.
 * Returns the cookieHash (UUID v4, 122-bit entropy) so the frontend can store
 * it in localStorage for future cookie-based recovery.
 */
function createBrowserSession(
  db: ReturnType<typeof getDb>,
  guestId: number,
  visitId: number
): string {
  const cookieHash = randomUUID();
  db.insert(browserSessions)
    .values({
      guestId,
      visitId,
      cookieHash,
      lastSeenAt: new Date().toISOString(),
    })
    .run();
  return cookieHash;
}

/**
 * Touch lastSeenAt on an existing BrowserSession row.
 */
function touchBrowserSession(
  db: ReturnType<typeof getDb>,
  sessionId: number
): void {
  db.update(browserSessions)
    .set({ lastSeenAt: new Date().toISOString() })
    .where(eq(browserSessions.id, sessionId))
    .run();
}

// ── input schemas ─────────────────────────────────────────────────────────────

const openVisitInput = z.object({
  guestId: z.number(),
  tableNo: z.string().optional(),
});

const closeVisitInput = z.object({ visitId: z.number() });

/**
 * resumeVisit accepts exactly two high-entropy, server-issued opaque tokens.
 *
 * Supported paths (in order of precedence):
 *   1. Cookie  — cookieHash (UUID v4, 122 bits) stored by the device at login
 *   2. Ticket  — ticketNo   (VIS-{id}-{48-bit hex}) shown at visit open / QR
 *
 * Intentionally EXCLUDED from Phase 5 (security reasons):
 *   - GuestId  — sequential integer, guessable (violates spec 025)
 *   - Phone    — needs OTP verification (Phase 6)
 *   - Staff    — needs authenticated role (Phase 6)
 *
 * QR codes are the visual carrier for ticketNo — same backend path.
 *
 * TODO (Phase 6): add per-IP rate limiting on this endpoint.
 */
const resumeVisitInput = z.object({
  cookieHash: z.string().optional(),
  ticketNo: z.string().optional(),
}).refine(
  data => data.cookieHash || data.ticketNo,
  { message: "Provide either cookieHash or ticketNo to resume a visit" }
);

// ── router ────────────────────────────────────────────────────────────────────

export const visitRouter = router({
  /**
   * Lightweight query to check if a stored visitId is still open.
   * Used by Home.tsx on mount to verify a localStorage-restored session
   * before trusting it — prevents serving a stale closed visitId.
   */
  getVisitStatus: publicProcedure
    .input(z.object({ visitId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const visit = db
        .select({ id: visits.id, status: visits.status, guestId: visits.guestId, ticketNo: visits.ticketNo })
        .from(visits)
        .where(eq(visits.id, input.visitId))
        .all()[0];
      return visit ?? null;
    }),

  openVisit: publicProcedure
    .input(openVisitInput)
    .mutation(async ({ input }): Promise<DomainCommandResult<any>> => {
      const db = getDb();
      const guest = findGuestById(db, input.guestId);
      if (!guest) throw new Error("Guest not found");

      // Generate ticket before insert so we can write it in the same row
      // (two-step: insert first to get the id, then update with ticket)
      const inserted = db
        .insert(visits)
        .values({
          guestId: input.guestId,
          tableNo: input.tableNo ?? null,
          status: "open",
          startedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        })
        .returning()
        .all()[0];

      const ticketNo = createVisitTicket(inserted.id);

      db.update(visits)
        .set({ ticketNo })
        .where(eq(visits.id, inserted.id))
        .run();

      // Create a BrowserSession so this device can resume by cookie
      const cookieHash = createBrowserSession(db, input.guestId, inserted.id);

      const visitWithTicket = { ...inserted, ticketNo };

      const result: DomainCommandResult<any> = {
        command: { name: "OpenVisit", occurredAt: new Date().toISOString() },
        events: [
          createDomainEvent({
            name: "VisitOpened",
            entityId: inserted.id,
            entityType: "visit",
            payload: { tableNo: inserted.tableNo },
          }),
        ],
        // cookieHash is returned to the frontend for localStorage storage.
        // It is the device's recovery credential for this session.
        data: { ...visitWithTicket, cookieHash },
      };

      getIo()?.emit(SOCKET_EVENT.VisitOpened, {
        visitId: inserted.id,
        guestId: input.guestId,
      });
      return result;
    }),

  closeVisit: publicProcedure
    .input(closeVisitInput)
    .mutation(async ({ input }): Promise<DomainCommandResult<any>> => {
      const db = getDb();
      const current = ensureVisitCanBeClosed(findVisitById(db, input.visitId));

      const updated =
        db
          .update(visits)
          .set({ status: "closed", closedAt: new Date().toISOString() })
          .where(eq(visits.id, input.visitId))
          .returning()
          .all()[0] ?? current;

      const result: DomainCommandResult<any> = {
        command: { name: "CloseVisit", occurredAt: new Date().toISOString() },
        events: [
          createDomainEvent({
            name: "VisitClosed",
            entityId: updated.id,
            entityType: "visit",
            payload: { closedAt: updated.closedAt },
          }),
        ],
        data: updated,
      };

      getIo()?.emit(SOCKET_EVENT.VisitClosed, { visitId: updated.id });
      return result;
    }),

  resumeVisit: publicProcedure
    .input(resumeVisitInput)
    .mutation(async ({ input, ctx }): Promise<DomainCommandResult<any>> => {
      const db = getDb();

      // ── Path 1: Cookie ──────────────────────────────────────────────────
      if (input.cookieHash) {
        const session = db
          .select()
          .from(browserSessions)
          .where(eq(browserSessions.cookieHash, input.cookieHash))
          .all()[0];

        if (session) {
          // Check expiry — expired session is treated as invalid
          if (session.expiredAt && new Date(session.expiredAt) < new Date()) {
            // Fall through to ticket path below — do not throw yet
          } else if (session.visitId) {
            const visit = db
              .select()
              .from(visits)
              .where(eq(visits.id, session.visitId))
              .orderBy(desc(visits.id))
              .all()[0];

            if (visit && visit.status === "open") {
              touchBrowserSession(db, session.id);
              const guest = findGuestById(db, session.guestId);

              return {
                command: { name: "OpenVisit", occurredAt: new Date().toISOString() },
                events: [
                  createDomainEvent({
                    name: "VisitOpened",
                    entityId: visit.id,
                    entityType: "visit",
                    payload: { resumed: true, path: "cookie" },
                  }),
                ],
                data: {
                  visit,
                  guest,
                  cookieHash: input.cookieHash,
                  resumed: true,
                },
              };
            }
          }
        }
      }

      // ── Path 2: Ticket (also handles QR — QR encodes ticketNo string) ───
      if (input.ticketNo) {
        const visit = db
          .select()
          .from(visits)
          .where(eq(visits.ticketNo, input.ticketNo))
          .orderBy(desc(visits.id))
          .all()[0];

        if (!visit || visit.status !== "open") {
          // Log failed attempt: IP + first 4 chars of token only (never full value)
          // Phase 6: replace with rate-limited counter per IP
          const ip = (ctx.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
            ?? ctx.req.socket?.remoteAddress
            ?? "unknown";
          const tokenHint = input.ticketNo.slice(0, 4) + "…";
          console.warn(`[resumeVisit] Failed ticket attempt — ip=${ip} token=${tokenHint}`);

          throw new Error("Visit not found or not open");
        }

        const guest = findGuestById(db, visit.guestId);
        if (!guest) throw new Error("Guest not found");

        // Issue a new BrowserSession for this device so next time cookie works
        const cookieHash = createBrowserSession(db, guest.id, visit.id);

        return {
          command: { name: "OpenVisit", occurredAt: new Date().toISOString() },
          events: [
            createDomainEvent({
              name: "VisitOpened",
              entityId: visit.id,
              entityType: "visit",
              payload: { resumed: true, path: "ticket" },
            }),
          ],
          data: {
            visit,
            guest,
            cookieHash,
            resumed: true,
          },
        };
      }

      // Both paths exhausted — this branch is unreachable due to .refine()
      // but TypeScript needs a definite return path
      throw new Error("No valid recovery token provided");
    }),
});
