"use client";

import { useEffect, useRef } from "react";

import { io, Socket } from "socket.io-client";

// Module-level singleton so every call to useSocket() shares one connection.
// This prevents duplicate connections when multiple components mount.

let socketSingleton: Socket | null = null;

// Track how many owner components are currently mounted.
// This prevents React Strict Mode's development-only mount/unmount cycle
// from disconnecting the socket while it is connecting.
let socketOwnerCount = 0;

function getSocket(): Socket {
  if (!socketSingleton) {
    socketSingleton = io({
      // Connect to the same origin the page was served from.

      // In dev the Next.js custom server handles /ws/ directly.
      path: "/ws/",

      // Do not connect automatically while the component is rendering.
      // The owner effect below explicitly starts the connection.
      autoConnect: false,

      // Reconnect automatically with exponential backoff.
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,

      // Start with polling (works everywhere), upgrade to WebSocket when available.
      transports: ["polling", "websocket"],
    });

    socketSingleton.on("connect_error", (error) => {
      console.error("[Socket.IO] Connection error:", error);
    });

    socketSingleton.on("disconnect", (reason) => {
      console.log("[Socket.IO] Disconnected:", reason);
    });
  }

  return socketSingleton;
}

/**
 * Returns a stable Socket.io client instance.
 *
 * Mount this hook once at the App root (App.tsx) to open the connection.
 * Individual pages call it again to get the same socket and attach listeners.
 *
 * Cleanup: the App-level mount disconnects on unmount (app teardown).
 * Page-level mounts only add/remove their own listeners.
 */
export function useSocket(options?: { owner?: boolean }): Socket {
  const socket = getSocket();
  const isOwner = options?.owner ?? false;

  const connectedRef = useRef(false);

  useEffect(() => {
    if (isOwner) {
      socketOwnerCount += 1;

      // Only the owner (App root) manages the connection lifecycle.
      if (!socket.connected) {
        socket.connect();
      }

      connectedRef.current = true;

      return () => {
        socketOwnerCount -= 1;

        // React Strict Mode can immediately unmount/remount effects in
        // development. Delay cleanup by one tick so that temporary cleanup
        // does not kill an active connection during the WebSocket upgrade.
        setTimeout(() => {
          if (socketOwnerCount === 0) {
            // Disconnect only when the entire app has actually unmounted,
            // not during React's development-only effect cycle.
            socket.disconnect();
            socketSingleton = null;
          }
        }, 0);
      };
    }

    // Non-owner callers: no lifecycle management, just return the socket.
    return undefined;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return socket;
}