"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";




export function useSocket(): Socket | null {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    /**
     * IMPORTANT:
     * No IP address or hostname is specified here.
     *
     * io() automatically uses the same origin that
     * loaded the current application.
     *
     * Examples:
     *   localhost      -> localhost
     *   LAN IP         -> current LAN IP
     *   hostname       -> current hostname
     */

    const socketInstance = io({
      path: "/ws/",
      transports: ["websocket"],
      upgrade: false,
    });

    setSocket(socketInstance);

    /**
     * Connection successful.
     */
    socketInstance.on("connect", () => {
      console.log(
        "[Socket.IO] Connected:",
        socketInstance.id
      );

      console.log(
        "[Socket.IO] Transport:",
        socketInstance.io.engine.transport.name
      );
    });

    /**
     * Connection failure.
     */
    socketInstance.on("connect_error", (error) => {
      console.error(
        "[Socket.IO] Connection error:",
        error.message
      );
    });

    /**
     * Connection closed.
     */
    socketInstance.on("disconnect", (reason) => {
      console.log(
        "[Socket.IO] Disconnected:",
        reason
      );
    });

    /**
     * Cleanup when the component unmounts.
     */
    return () => {
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
      setSocket(null);
    };
  }, []);

  return socket;
}

