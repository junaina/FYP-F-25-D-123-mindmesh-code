"use client";

import { useRef, useState } from "react";
import { Paperclip, Send, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function MessageInput({
  threadId,
  projectId,
  onSent,
}: {
  threadId: string;
  projectId: string;
  onSent?: (message: any) => void;
}) {
  const [value, setValue] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function send() {
  const text = value.trim();
  if (!text) return; // no files allowed yet

  setBusy(true);

  try {
    const res = await fetch(
      `/api/projects/${projectId}/discussions/threads/${threadId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: text
        }),
      }
    );

    if (!res.ok) {
      console.error("Failed to send message");
      return;
    }

    const newMessage = await res.json();

    setValue("");
    

  } finally {
    setBusy(false);
  }
}


  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <div className="relative">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Message — use @ to mention, : to add emoji"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />

          <div className="absolute right-2 bottom-1.5 flex items-center gap-1">
            <input
              ref={fileRef}
              type="file"
              multiple
              hidden
              onChange={(e) => setFiles(e.target.files)}
            />

            <Button
              size="icon"
              variant="ghost"
              type="button"
              onClick={() => fileRef.current?.click()}
            >
              <Paperclip className="h-5 w-5" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button size="icon" variant="ghost" type="button">
                  <Smile className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-2 w-72">
                <div className="text-sm text-muted-foreground">
                  Emoji picker coming soon.
                </div>
              </PopoverContent>
            </Popover>

            <Button size="icon" disabled={busy} onClick={send} type="button">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {files?.length ? (
          <div className="mt-2 text-xs text-muted-foreground">
            {files.length} file(s) selected
          </div>
        ) : null}
      </div>
    </div>
  );
}
