"use client";

import useSWR from "swr";
import { useEffect, useRef } from "react";
import { MessageInput } from "@/components/discussions/MessageInput";
import { ReactionBar } from "@/components/discussions/ReactionBar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { MessageDTO } from "@/components/types/discussions";

import { useThreadSocket } from "@/hooks/useThreadSocket";
import { getSocket } from "@/lib/socket-client";

const fetcher3 = (url: string) => fetch(url).then((r) => r.json());

export function ChatRoom({
  threadId,
  projectId,
}: {
  threadId: string;
  projectId: string;
}) {
  const { data, mutate } = useSWR<{ messages: MessageDTO[] }>(
   `/api/projects/${projectId}/discussions/threads/${threadId}/messages?limit=100`,
    fetcher3
  );

  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages?.length]);

  // LISTEN FOR REAL-TIME INCOMING MESSAGES
  useThreadSocket(threadId, (msg) => {
    mutate(
      (prev) => ({
        messages: [...(prev?.messages ?? []), msg],
      }),
      false
    );
  });

  // When MessageInput sends a new message
  const handleLocalSend = (newMessage: MessageDTO) => {
    // optimistic update
    mutate(
      (prev) => ({
        messages: [...(prev?.messages ?? []), newMessage],
      }),
      false
    );

    // send to other clients via socket
    const socket = getSocket();
    socket.emit("message:new", threadId, newMessage);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-background">
        {data?.messages?.map((m) => (
          <div key={m.id} className="flex items-start gap-3 group">
            <Avatar className="h-8 w-8">
              <AvatarImage src={m.sender.avatarUrl ?? undefined} />
              <AvatarFallback>
                {(m.sender.firstName?.[0] ?? "") +
                  (m.sender.lastName?.[0] ?? "")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {m.sender.firstName} {m.sender.lastName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(m.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="mt-1 rounded-2xl bg-muted p-3 whitespace-pre-wrap break-words">
                {m.body}
              </div>

              {m.attachments?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {m.attachments.map((f) => (
                    <a
                      key={f.id}
                      href={`/api/files/${f.id}`}
                      className="text-sm underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {f.filename}
                    </a>
                  ))}
                </div>
              ) : null}

              <ReactionBar
                threadId={threadId}
                message={m}
                onChange={() => mutate()}
              />
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* INPUT AREA */}
      <div className="border-t p-4">
        <MessageInput
          projectId={projectId}
          threadId={threadId}
          onSent={handleLocalSend}
        />
      </div>
    </div>
  );
}
