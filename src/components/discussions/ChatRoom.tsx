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
function fullName(u: { firstName: string; lastName: string }) {
  return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
}

function renderMentions(
  body: string,
  mentions?: { user: { id: string; firstName: string; lastName: string } }[],
) {
  // Stored format: @[Display Name](userId)
  // Accept any id format so UI never leaks ids.
  const re = /@\[(.*?)\]\(([^)\s]+)\)/g;

  // Prefer DB names when available (in case label is stale)
  const byId = new Map<string, string>();
  for (const m of mentions ?? []) byId.set(m.user.id, fullName(m.user));

  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(body))) {
    const [raw, fallbackLabel, id] = match;
    const start = match.index;
    const end = start + raw.length;

    if (start > last) parts.push(body.slice(last, start));

    const label = byId.get(id) ?? fallbackLabel;
    parts.push(
      <span key={`${start}-${end}`} className="mm-mention">
        @{label}
      </span>,
    );

    last = end;
  }

  if (last < body.length) parts.push(body.slice(last));
  return parts;
}

/** --- attachments UI helpers --- */
function isImageFile(filename?: string, mime?: string) {
  if (mime?.startsWith("image/")) return true;
  if (!filename) return false;
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(filename);
}

function formatBytes(bytes?: number) {
  if (bytes == null) return "";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  const dp = i === 0 ? 0 : v >= 10 ? 0 : 1;
  return `${v.toFixed(dp)} ${units[i]}`;
}

type AttachmentLike = {
  id: string;
  filename: string;
  mime?: string | null;
  size?: number | null;
};

function AttachmentGrid({ files }: { files: AttachmentLike[] }) {
  return (
    <div className="mt-2 grid gap-2 sm:grid-cols-2">
      {files.map((f) => {
        const href = `/api/files/${f.id}`;
        const isImg = isImageFile(f.filename, f.mime ?? undefined);
        const metaParts = [
          f.mime ? f.mime : null,
          f.size != null ? formatBytes(f.size) : null,
        ].filter(Boolean);

        return (
          <a
            key={f.id}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-3 rounded-xl border bg-background/40 px-3 py-2 hover:bg-background/60 transition-colors"
          >
            {/* Left thumbnail/icon */}
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border bg-background">
              {isImg ? (
                <img
                  src={href}
                  alt={f.filename}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="text-[10px] font-medium opacity-70">
                  {(f.filename.split(".").pop() ?? "FILE")
                    .toUpperCase()
                    .slice(0, 4)}
                </span>
              )}
            </div>

            {/* Name + meta */}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium group-hover:underline">
                {f.filename}
              </div>
              {metaParts.length ? (
                <div className="truncate text-xs text-muted-foreground">
                  {metaParts.join(" • ")}
                </div>
              ) : null}
            </div>

            <div className="text-xs text-muted-foreground">↗</div>
          </a>
        );
      })}
    </div>
  );
}

export function ChatRoom({
  threadId,
  projectId,
}: {
  threadId: string;
  projectId: string;
}) {
  const { data, mutate } = useSWR<{ messages: MessageDTO[] }>(
    `/api/projects/${projectId}/discussions/threads/${threadId}/messages?limit=100`,
    fetcher3,
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
      false,
    );
  });

  // When MessageInput sends a new message
  const handleLocalSend = (newMessage: MessageDTO) => {
    // optimistic update
    mutate(
      (prev) => ({
        messages: [...(prev?.messages ?? []), newMessage],
      }),
      false,
    );

    // send to other clients via socket
    const socket = getSocket();
    socket.emit("message:new", threadId, newMessage);
  };
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4 bg-background">
        {data?.messages?.map((m) => {
          const body = (m.body ?? "").trim();
          const hasText = body.length > 0;
          const files = (m.attachments ?? []) as unknown as AttachmentLike[];
          const hasFiles = files.length > 0;

          return (
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

                {/* ✅ Only render bubble if there’s actual text */}
                {hasText ? (
                  <div className="mt-1 rounded-2xl bg-muted p-3 whitespace-pre-wrap break-words">
                    {renderMentions(body, m.mentions)}
                  </div>
                ) : null}

                {/* ✅ Render attachments nicely (even if body is empty) */}
                {hasFiles ? <AttachmentGrid files={files} /> : null}

                <ReactionBar
                  projectId={projectId}
                  threadId={threadId}
                  message={m}
                  onChange={() => mutate()}
                />
              </div>
            </div>
          );
        })}

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
