import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import next from "next";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./api/middleware/oauth";
import { registerStorageProxy } from "./api/middleware/storageProxy";
import { registerPortalRoutes } from "./api/middleware/portal";
import { appRouter } from "./api/routers";
import { createContext } from "./api/lib/context";
import { initIo } from "./api/lib/socket";
import { upload, getPublicUrl } from "./api/middleware/upload";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => server.close(() => resolve(true)));
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev, dir: process.cwd() });
const handle = nextApp.getRequestHandler();

async function startServer() {
  await nextApp.prepare();

  const app = express();
  const server = createServer(app);

  // Attach Socket.io to the HTTP server before any routes so the singleton
  // is available to all routers immediately.
  initIo(server);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Existing backend middlewares
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerPortalRoutes(app);

  // tRPC API endpoint
  app.use(
    "/api/trpc",
    createExpressMiddleware({ router: appRouter, createContext })
  );

  // Image upload endpoint via multer
  app.post("/api/upload", upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const url = getPublicUrl(req.file.filename);
    res.json({ url });
  });

  // Next.js page request handler for all non-API routes (Express 5 compatible)
  app.use((req, res) => {
    return handle(req, res);
  });

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  const { networkInterfaces } = await import("os");
  const nets = networkInterfaces();
  let lanIp = "localhost";

  for (const iface of Object.values(nets)) {
    for (const net of iface ?? []) {
      if (
        net.family === "IPv4" &&
        !net.internal &&
        !net.address.startsWith("169.254") &&
        !net.address.startsWith("172.")
      ) {
        lanIp = net.address;
        break;
      }
    }
    if (lanIp !== "localhost") break;
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Next.js + Socket.io Server running on http://localhost:${port}/`);
    console.log(`📱 Mobile / LAN:                       http://${lanIp}:${port}/`);
  });
}

startServer().catch(console.error);
