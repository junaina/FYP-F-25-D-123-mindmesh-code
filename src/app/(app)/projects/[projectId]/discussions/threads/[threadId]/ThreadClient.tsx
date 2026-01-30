"use client";

import useSWR from "swr";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Bell, BellOff, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatRoom } from "@/components/discussions/ChatRoom";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ThreadClient({
  projectId,
  threadId,
  embedded = false,
  onBackToList,
}: {
  projectId: string;
  threadId: string;
  embedded?: boolean;
  onBackToList?: () => void;
}) {
  const { data, mutate } = useSWR(
    `/api/projects/${projectId}/discussions/threads/${threadId}/messages`,
    fetcher,
  );

  const [muted, setMuted] = useState<boolean>(!!data?.prefs?.isMuted);
  useEffect(() => setMuted(!!data?.prefs?.isMuted), [data?.prefs?.isMuted]);

  return (
    <div
      className={`flex flex-col ${embedded ? "h-full min-h-0" : "h-[calc(100vh-64px)]"}`}
    >
      <div className="px-6 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={`/projects/${projectId}/discussions`}>
            {/* <Button variant="ghost" size="icon" aria-label="Back">
              <ArrowLeft className="h-5 w-5" />
            </Button> */}
          </Link>{" "}
          {embedded && onBackToList ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Back"
              onClick={onBackToList}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <Link href={`/projects/${projectId}/discussions`}>
              <Button variant="ghost" size="icon" aria-label="Back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
          )}
          <div>
            <h2 className="text-lg font-semibold leading-none">
              {data?.topic ?? "Thread"}
            </h2>
            {data?.description ? (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {data.description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={muted ? "secondary" : "outline"}
            onClick={async () => {
              await fetch(`/api/threads/${threadId}/mute`, {
                method: "POST",
                body: JSON.stringify({ mute: !muted }),
              });
              setMuted((m) => !m);
              mutate();
            }}
          >
            {muted ? (
              <BellOff className="h-4 w-4 mr-2" />
            ) : (
              <Bell className="h-4 w-4 mr-2" />
            )}
            {muted ? "Muted" : "Mute"}
          </Button>

          {data?.isAdmin ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(window.location.href)
                    }
                  >
                    Copy link
                  </button>
                </DropdownMenuItem>

                <DropdownMenuItem className="text-destructive" asChild>
                  <button
                    onClick={async () => {
                      if (!confirm("Delete this thread?")) return;
                      await fetch(`/api/threads/${threadId}`, {
                        method: "DELETE",
                      });
                      window.location.href = `/projects/${projectId}/discussions`;
                    }}
                  >
                    Delete thread
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      <ChatRoom threadId={threadId} projectId={projectId} />
    </div>
  );
}
