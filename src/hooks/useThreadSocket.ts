// src/hooks/useThreadSocket.ts
"use client";

import { useEffect } from "react";
import { getSocket } from "@/lib/socket-client";

export function useThreadSocket(
  threadId: string,
  onMessage: (msg: any) => void
) {
  useEffect(() => {
    const socket = getSocket();

    // join room
    socket.emit("thread:join", threadId);

    // listen
    socket.on("message:receive", onMessage);

    return () => {
      socket.off("message:receive", onMessage);
    };
  }, [threadId, onMessage]);
}
