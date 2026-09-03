import { describe, it, expect } from "vitest";
import express from "express";
import { registerPortalRoutes } from "./index";

function createMockApp() {
  const app = express();
  registerPortalRoutes(app);
  return app;
}

describe("RFC 8910 / RFC 8908 Captive Portal JSON API", () => {
  it("returns RFC compliant JSON with application/captive+json header on /api/captive", async () => {
    const app = createMockApp();
    const server = app.listen(0);
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/captive`);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("application/captive+json");
      expect(res.headers.get("access-control-allow-origin")).toBe("*");

      const body = await res.json();
      expect(body.captive).toBe(true);
      expect(body["user-portal-url"]).toBe(`http://127.0.0.1:${port}/portal`);
      expect(body["venue-info-url"]).toBe(`http://127.0.0.1:${port}/`);
      expect(body["can-extend-session"]).toBe(false);
    } finally {
      server.close();
    }
  });

  it("handles standard well-known RFC 8908 path /.well-known/capport", async () => {
    const app = createMockApp();
    const server = app.listen(0);
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/.well-known/capport`);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("application/captive+json");

      const body = await res.json();
      expect(body.captive).toBe(true);
      expect(body["user-portal-url"]).toContain("/portal");
    } finally {
      server.close();
    }
  });

  it("integrates with vendor parameters (e.g. MikroTik)", async () => {
    const app = createMockApp();
    const server = app.listen(0);
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/captive?mac=AA:BB:CC:DD:EE:FF&ip=192.168.88.15&link-orig=http://example.com`);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.captive).toBe(true);
      expect(body["user-portal-url"]).toContain("source=mikrotik");
      expect(body["user-portal-url"]).toContain("link-orig=http%3A%2F%2Fexample.com");
    } finally {
      server.close();
    }
  });
});
