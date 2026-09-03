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
 * Derives the base URL of the application from the incoming request.
 */
export function getAppBaseUrl(req: Request): string {
  const protocol = req.headers["x-forwarded-proto"] ?? req.protocol ?? "http";
  const host = req.headers["x-forwarded-host"] ?? req.headers["host"] ?? "localhost";
  return `${protocol}://${host}`;
}

/**
 * Handler for RFC 8910 / RFC 8908 Captive Portal JSON API (DHCP Option 114 / IPv6 RA Option 37).
 *
 * Modern Android (11+), iOS/macOS, and Windows clients query this API to discover the captive state
 * and user portal URL without resorting to blind HTTP redirects.
 *
 * Content-Type MUST be: application/captive+json
 */
export function handleCaptivePortalJson(req: Request, res: Response): void {
  const appBaseUrl = getAppBaseUrl(req);
  const adapter = getPortalAdapter(req);
  const search = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";

  const userPortalUrl = adapter
    ? adapter.buildRedirectUrl(appBaseUrl, req)
    : `${appBaseUrl}/portal${search}`;

  const payload = {
    captive: true,
    "user-portal-url": userPortalUrl,
    "venue-info-url": `${appBaseUrl}/`,
    "can-extend-session": false,
  };

  res.setHeader("Content-Type", "application/captive+json; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate, max-age=0");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Authorization");

  res.status(200).json(payload);
}

/**
 * Registers all portal routes:
 * 1. Traditional redirect entry: GET /api/portal/entry
 * 2. RFC 8910 / RFC 8908 JSON API endpoints:
 *    - GET /api/captive (User-configured DHCP Option 114 endpoint)
 *    - GET /.well-known/capport (RFC 8908 Standard Well-Known endpoint)
 *    - GET /api/captive-portal (Standard Alias)
 */
export function registerPortalRoutes(app: Express): void {
  // RFC 8910 / RFC 8908 JSON API endpoints
  const captiveRoutes = ["/api/captive", "/.well-known/capport", "/api/captive-portal"];

  captiveRoutes.forEach((route) => {
    app.get(route, handleCaptivePortalJson);
    app.post(route, handleCaptivePortalJson);
    app.options(route, (req: Request, res: Response) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Authorization");
      res.sendStatus(204);
    });
  });

  // Traditional HTTP redirection entry route
  app.get("/api/portal/entry", (req: Request, res: Response) => {
    const appBaseUrl = getAppBaseUrl(req);
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

