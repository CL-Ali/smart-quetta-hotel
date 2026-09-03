import type { Request } from "express";
import type { PortalAdapter } from "./portalAdapter";

/**
 * OpenWRT / nodogsplash / OpenNDS captive portal adapter.
 *
 * nodogsplash passes:
 *   clientip, clientmac, gatewayname, tok, hid (for nodogsplash)
 * OpenNDS uses similar params with slight variations.
 *
 * Ref: https://nodogsplashdocs.readthedocs.io/
 */
export const openwrtAdapter: PortalAdapter = {
  detect(req: Request): boolean {
    // nodogsplash signature: clientip + tok
    // OpenNDS signature: clientip + gatewayname
    return !!(
      req.query["clientip"] &&
      (req.query["tok"] || req.query["gatewayname"])
    );
  },

  buildRedirectUrl(appBaseUrl: string, _req: Request): string {
    const url = new URL("/portal", appBaseUrl);
    url.searchParams.set("source", "openwrt");
    return url.toString();
  },
};
