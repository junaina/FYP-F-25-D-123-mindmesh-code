import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const newSocket = io({
      path: "/api/socket",
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("✔ Socket connected:", newSocket.id);
    });

    newSocket.on("connect_error", (err) => {
      console.error(" Socket connection error:", err.message);
    });

    socket = newSocket;
  }

  return socket;
}
