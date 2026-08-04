import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

// Module-level singleton so every call to useSocket() shares one connection.
// This prevents duplicate connections when multiple components mount.
let socketSingleton: Socket | null = null;

function getSocket(): Socket {
  if (!socketSingleton) {
    socketSingleton = io({
      // Connect to the same origin the page was served from.
      // In dev the Vite proxy forwards /ws/ to the Express server.
      path: "/ws/",
      // Reconnect automatically with exponential backoff.
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      // Start with polling (works everywhere), upgrade to WebSocket when available.
      transports: ["polling", "websocket"],
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
      // Only the owner (App root) manages the connection lifecycle.
      if (!socket.connected) {
        socket.connect();
      }
      connectedRef.current = true;

      return () => {
        // Disconnect only when the entire app unmounts, not on page navigation.
        socket.disconnect();
        socketSingleton = null;
      };
    }
    // Non-owner callers: no lifecycle management, just return the socket.
    return undefined;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return socket;
}
