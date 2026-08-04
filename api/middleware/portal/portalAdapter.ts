import type { Request } from "express";

/**
 * Isolation boundary between vendor captive-portal behavior and app logic.
 *
 * Each router vendor detects its own request signature and builds its own
 * redirect URL. The core app never knows which vendor is in use.
 *
 * Spec: portal must not contain business logic (009-captive-portal.md).
 */
export interface PortalAdapter {
  /** Returns true if this request came from this vendor's captive portal. */
  detect(req: Request): boolean;

  /**
   * Builds the URL the guest should be redirected to inside the app.
   * @param appBaseUrl  The base URL of the restaurant app (e.g. http://192.168.1.1:3000)
   * @param req         The original portal redirect request
   */
  buildRedirectUrl(appBaseUrl: string, req: Request): string;
}
