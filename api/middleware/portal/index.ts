import type { Express, Request, Response } from "express";
import type { PortalAdapter } from "./portalAdapter";
import { mikrotikAdapter } from "./mikrotikAdapter";
import { openwrtAdapter } from "./openwrtAdapter";
import { unifiAdapter } from "./unifiAdapter";

// All registered vendor adapters — order matters: first match wins.
const ADAPTERS: PortalAdapter[] = [
  mikrotikAdapter,
  unifiAdapter,
  openwrtAdapter,
];

/**
 * Returns the first adapter whose detect() returns true, or null if none match.
 * Used by the portal entry route and can be used by tests.
 */
export function getPortalAdapter(req: Request): PortalAdapter | null {
  return ADAPTERS.find(a => a.detect(req)) ?? null;
}

/**
 * Registers the GET /api/portal/entry route on the Express app.
 *
 * This is the only portal-aware route. All vendor-specific behavior lives in
 * the adapters above — the core app never sees it.
 *
 * Flow:
 *   Captive portal (MikroTik / UniFi / OpenWRT)
 *     → redirects guest browser to GET /api/portal/entry?{vendor-params}
 *     → this route detects the vendor, builds clean /portal?source=X URL
 *     → guest lands on the React app's /portal route
 *     → Portal.tsx reads source param and navigates to / (Home)
 *
 * If no vendor matches (e.g. direct LAN access), redirects straight to /.
 */
export function registerPortalRoutes(app: Express): void {
  app.get("/api/portal/entry", (req: Request, res: Response) => {
    // Derive the app base URL from the incoming request so this works on any
    // LAN IP without hardcoding the address.
    const protocol = req.headers["x-forwarded-proto"] ?? req.protocol ?? "http";
    const host = req.headers["x-forwarded-host"] ?? req.headers["host"] ?? "localhost";
    const appBaseUrl = `${protocol}://${host}`;

    const adapter = getPortalAdapter(req);

    if (adapter) {
      const redirectUrl = adapter.buildRedirectUrl(appBaseUrl, req);
      res.redirect(302, redirectUrl);
    } else {
      // No vendor matched — direct LAN access or unknown portal; go straight to app
      res.redirect(302, "/");
    }
  });
}
