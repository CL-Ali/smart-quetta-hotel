import type { Request } from "express";
import type { PortalAdapter } from "./portalAdapter";

/**
 * Ubiquiti UniFi Guest Portal captive portal adapter.
 *
 * UniFi redirects guests to the external portal URL with:
 *   id  (AP MAC address)
 *   t   (Unix timestamp)
 *   url (original URL the guest tried to visit)
 *   ap  (AP name — optional)
 *
 * Ref: https://help.ui.com/hc/en-us/articles/204950374
 */
export const unifiAdapter: PortalAdapter = {
  detect(req: Request): boolean {
    // UniFi always sends 'id' (AP MAC) and 't' (timestamp) together
    return !!(req.query["id"] && req.query["t"]);
  },

  buildRedirectUrl(appBaseUrl: string, req: Request): string {
    const url = new URL("/portal", appBaseUrl);
    url.searchParams.set("source", "unifi");
    // Pass the original URL if present — useful for post-auth deep-link
    const origUrl = req.query["url"];
    if (typeof origUrl === "string" && origUrl) {
      url.searchParams.set("url", origUrl);
    }
    return url.toString();
  },
};
