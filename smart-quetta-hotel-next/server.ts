
// server.ts

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

/**
 * ------------------------------------------------------------
 * Port helpers
 * ------------------------------------------------------------
 */

function isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const testServer = net.createServer();

        testServer.once("error", () => {
            resolve(false);
        });

        testServer.listen(port, "0.0.0.0", () => {
            testServer.close(() => {
                resolve(true);
            });
        });
    });
}

async function findAvailablePort(
    startPort: number
): Promise<number> {
    for (let port = startPort; port < startPort + 20; port++) {
        if (await isPortAvailable(port)) {
            return port;
        }
    }

    throw new Error(
        `No available port found starting from ${startPort}`
    );
}

/**
 * ------------------------------------------------------------
 * Start server
 * ------------------------------------------------------------
 */

async function startServer(): Promise<void> {
    const preferredPort = Number.parseInt(
        process.env.PORT || "3000",
        10
    );

    if (Number.isNaN(preferredPort)) {
        throw new Error(
            "Invalid PORT environment variable."
        );
    }

    console.log(
        `[Server] Looking for available port starting at ${preferredPort}...`
    );

    const port = await findAvailablePort(
        preferredPort
    );

    if (port !== preferredPort) {
        console.warn(
            `[Server] Port ${preferredPort} is busy. Using ${port}.`
        );
    }

    /**
     * ----------------------------------------------------------
     * Create Express + raw HTTP server FIRST
     * ----------------------------------------------------------
     */

    const app = express();
    const httpServer = createServer(app);

    console.log("[Server] HTTP server created.");

    /**
     * ----------------------------------------------------------
     * Initialize Next.js
     * ----------------------------------------------------------
     *
     * Next receives the SAME HTTP server that Express and
     * Socket.IO use.
     *
     * No specific IP address is used.
     */
    const nextApp = next({
        dev,
        hostname: "0.0.0.0",
        port,
        httpServer,
    });

    const handle = nextApp.getRequestHandler();

    console.log("[Next] Preparing Next.js...");

    /**
     * Prepare Next.js.
     */
    await nextApp.prepare();

    console.log("[Next] Next.js prepared successfully.");

    /**
     * ----------------------------------------------------------
     * Socket.IO
     * ----------------------------------------------------------
     *
     * Attach Socket.IO to the SAME HTTP server.
     */
    initIo(httpServer);

    console.log(
        "[Socket.IO] Attached to shared HTTP server."
    );

    /**
     * ----------------------------------------------------------
     * Express middleware
     * ----------------------------------------------------------
     */

    app.use(
        express.json({
            limit: "50mb",
        })
    );

    app.use(
        express.urlencoded({
            limit: "50mb",
            extended: true,
        })
    );

    /**
     * ----------------------------------------------------------
     * Custom routes
     * ----------------------------------------------------------
     */

    registerStorageProxy(app);
    registerOAuthRoutes(app);
    registerPortalRoutes(app);

    /**
     * ----------------------------------------------------------
     * tRPC
     * ----------------------------------------------------------
     */

    app.use(
        "/api/trpc",
        createExpressMiddleware({
            router: appRouter,
            createContext,
        })
    );

    /**
     * ----------------------------------------------------------
     * Upload
     * ----------------------------------------------------------
     */

    app.post(
        "/api/upload",
        upload.single("image"),
        (req, res) => {
            if (!req.file) {
                return res.status(400).json({
                    error: "No file uploaded",
                });
            }

            const url = getPublicUrl(
                req.file.filename
            );

            return res.json({
                url,
            });
        }
    );

    /**
     * ----------------------------------------------------------
     * Next.js catch-all
     * ----------------------------------------------------------
     */

    app.all("/{*splat}", (req, res) => {
        return handle(req, res);
    });

    /**
     * ----------------------------------------------------------
     * Start HTTP server
     * ----------------------------------------------------------
     */

    console.log(
        `[Server] Starting HTTP server on port ${port}...`
    );

    await new Promise<void>((resolve, reject) => {
        const onError = (error: Error) => {
            httpServer.off("listening", onListening);
            reject(error);
        };

        const onListening = () => {
            httpServer.off("error", onError);
            resolve();
        };

        httpServer.once("error", onError);
        httpServer.once("listening", onListening);

        httpServer.listen(
            port,
            "0.0.0.0"
        );
    });

    console.log("");
    console.log(
        "=========================================="
    );
    console.log(
        "Smart Quetta Hotel server started"
    );
    console.log(
        `Mode: ${dev ? "development" : "production"}`
    );
    console.log(
        `Port: ${port}`
    );
    console.log(
        `Local: http://localhost:${port}`
    );
    console.log(
        "Network: available through the machine's current IP/hostname"
    );
    console.log(
        "Socket.IO: /ws/"
    );
    console.log(
        "=========================================="
    );
    console.log("");
}

/**
 * ------------------------------------------------------------
 * Error handling
 * ------------------------------------------------------------
 */

startServer().catch((error) => {
    console.error("");
    console.error(
        "=========================================="
    );
    console.error(
        "SERVER STARTUP FAILED"
    );
    console.error(
        "=========================================="
    );
    console.error(error);
    console.error("");

    process.exit(1);
});

