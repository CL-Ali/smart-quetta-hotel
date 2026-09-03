// server.ts  (project root)
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

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

function isPortAvailable(port: number): Promise<boolean> {
    return new Promise(resolve => {
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

async function startServer() {
    // Next.js has to finish compiling/preparing before it can handle requests.
    await nextApp.prepare();

    const app = express();
    const server = createServer(app);

    // Attach Socket.io to the raw HTTP server before any routes, same as before.
    initIo(server);

    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ limit: "50mb", extended: true }));

    registerStorageProxy(app);
    registerOAuthRoutes(app);
    registerPortalRoutes(app);

    app.use(
        "/api/trpc",
        createExpressMiddleware({ router: appRouter, createContext })
    );

    app.post("/api/upload", upload.single("image"), (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        const url = getPublicUrl(req.file.filename);
        res.json({ url });
    });

    // Everything that isn't one of the routes above (i.e. all page requests)
    // gets handed off to Next.js instead of Vite's setupVite/serveStatic.
    app.all("/{*splat}", (req, res) => handle(req, res));

    const preferredPort = parseInt(process.env.PORT || "3000");
    const port = await findAvailablePort(preferredPort);

    if (port !== preferredPort) {
        console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
    }

    server.listen(port, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${port}/`);
    });
}

startServer().catch(console.error);