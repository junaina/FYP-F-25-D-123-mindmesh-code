import type { NextApiRequest, NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!res.socket) {
    console.error("❌ No socket found");
    res.status(500).end("Socket missing");
    return;
  }

  const server = res.socket.server as any;

  if (!server.io) {
    console.log("🔧 Initializing Socket.IO…");

    const io = new SocketIOServer(server, {
      path: "/api/socket",
      cors: { origin: "*" },
    });

    io.on("connection", (socket) => {
      console.log("✔ Socket connected:", socket.id);

      socket.on("thread:join", (threadId: string) => {
        socket.join(threadId);
      });

      socket.on("message:new", (threadId: string, message: any) => {
        io.to(threadId).emit("message:receive", message);
      });
    });

    server.io = io;
  }

  res.end();
}
