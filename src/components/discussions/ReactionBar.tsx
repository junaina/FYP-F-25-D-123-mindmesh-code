"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { MessageDTO } from "@/components/types/discussions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🎉", "😮", "✅"];
export function ReactionBar({
  message,
  threadId,
  projectId,
  onChange,
}: {
  message: MessageDTO;
  threadId: string;
  projectId: string;
  onChange?: () => void;
}) {
  const [pending, setPending] = useState(false);
  const emojis = message.reactions?.length ? message.reactions : [];

  async function toggle(emoji: string) {
    if (pending) return;
    setPending(true);
    try {
      await fetch(
        `/api/projects/${projectId}/discussions/threads/${threadId}/messages/${message.id}/reactions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji }),
        },
      );
      onChange?.();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-2 flex items-center gap-2 opacity-80">
      {emojis.map((r) => (
        <Button
          key={r.emoji}
          size="sm"
          variant={r.reactedByMe ? "secondary" : "outline"}
          onClick={() => toggle(r.emoji)}
        >
          <span className="mr-1">{r.emoji}</span>
          {r.count}
        </Button>
      ))}
      {/* NEW: plus opens quick picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 w-7 p-0">
            +
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="flex items-center gap-1">
            {QUICK_REACTIONS.map((e) => (
              <Button
                key={e}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => toggle(e)}
              >
                {e}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
