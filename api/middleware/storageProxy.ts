import type { Express } from "express";

/**
 * Storage proxy placeholder.
 * Returns 501 until a storage backend is configured.
 * To wire up a storage backend, implement the handler here.
 */
export function registerStorageProxy(app: Express) {
  app.get("/storage/*splat", (_req, res) => {
    res.status(501).send("Storage proxy not configured");
  });
}
