import type { Request } from "express";
import type { PortalAdapter } from "./portalAdapter";

/**
 * MikroTik Hotspot captive portal adapter.
 *
 * MikroTik appends query params to the redirect URL:
 *   mac, ip, username, link-login, link-orig, error, chap-id, chap-challenge, popup
 *
 * Ref: https://wiki.mikrotik.com/wiki/Manual:Customizing_Hotspot
 */
export const mikrotikAdapter: PortalAdapter = {
  detect(req: Request): boolean {
    // MikroTik always passes 'mac' and 'ip' together
    return !!(req.query["mac"] && req.query["ip"]);
  },

  buildRedirectUrl(appBaseUrl: string, req: Request): string {
    const url = new URL("/portal", appBaseUrl);
    url.searchParams.set("source", "mikrotik");
    // Pass along the original destination if available — useful for deep-linking
    const linkOrig = req.query["link-orig"];
    if (typeof linkOrig === "string" && linkOrig) {
      url.searchParams.set("link-orig", linkOrig);
    }
    return url.toString();
  },
};
