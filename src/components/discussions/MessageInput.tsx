"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { Paperclip, Send, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
type MentionUser = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
};
// Stored format: @[Display Name](userId)
const MENTION_RE = /@\[(.*?)\]\(([^)\s]+)\)/g;

function findMentionForBackspace(text: string, cursor: number) {
  // Backspace deletes char BEFORE cursor. We delete mention if cursor is inside it or at its end.
  const re = new RegExp(MENTION_RE); // fresh regex so lastIndex doesn't carry over
  let m: RegExpExecArray | null;

  while ((m = re.exec(text))) {
    const start = m.index;
    const end = start + m[0].length;
    if (cursor > start && cursor <= end) return { start, end };
  }
  return null;
}

function findMentionForDelete(text: string, cursor: number) {
  // Delete deletes char AT cursor. We delete mention if cursor is inside it or at its start.
  const re = new RegExp(MENTION_RE);
  let m: RegExpExecArray | null;

  while ((m = re.exec(text))) {
    const start = m.index;
    const end = start + m[0].length;
    if (cursor >= start && cursor < end) return { start, end };
  }
  return null;
}

function fullName(u: MentionUser) {
  return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
}
function renderMentionsInline(text: string) {
  const re = /@\[(.*?)\]\(([^)\s]+)\)/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text))) {
    const [raw, label] = match;
    const start = match.index;
    const end = start + raw.length;

    if (start > last) parts.push(text.slice(last, start));
    parts.push(
      <span key={`${start}-${end}`} className="mm-mention">
        @{label}
      </span>,
    );
    last = end;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

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

  // mention state
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQ, setMentionQ] = useState("");
  const [mentionResults, setMentionResults] = useState<MentionUser[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // detect "@query" at end (fast shipped version)
  function computeMentionQuery(text: string) {
    // match last "@something" at end of input
    const m = text.match(/(?:^|\s)@([a-zA-Z0-9._-]{0,32})$/);
    return m ? m[1] : null;
  }
  useEffect(() => {
    const q = computeMentionQuery(value);
    if (q === null) {
      setMentionOpen(false);
      setMentionQ("");
      setMentionResults([]);
      setActiveIndex(0);
      return;
    }
    setMentionOpen(true);
    setMentionQ(q);
  }, [value]);
  // fetch mention suggestions (tiny debounce)
  useEffect(() => {
    if (!mentionOpen) return;

    const t = setTimeout(async () => {
      const res = await fetch(
        `/api/projects/${projectId}/members?q=${encodeURIComponent(mentionQ)}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      setMentionResults(data.users ?? data.members ?? []);
      setActiveIndex(0);
    }, 120);

    return () => clearTimeout(t);
  }, [mentionOpen, mentionQ, projectId]);
  function insertMention(u: MentionUser) {
    const name = fullName(u) || "user";
    // replace trailing "@query" with "@[Name](id) "
    const next = value.replace(
      /(^|\s)@([a-zA-Z0-9._-]{0,32})$/,
      `$1@[${name}](${u.id}) `,
    );
    setValue(next);
    setMentionOpen(false);
    setMentionResults([]);
    setMentionQ("");
    setActiveIndex(0);

    // put cursor at end
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      const len = next.length;
      inputRef.current?.setSelectionRange(len, len);
    });
  }
  async function send() {
    const text = value.trim();
    const selected = files ? Array.from(files) : [];

    // allow files-only messages
    if (!text && selected.length === 0) return;

    setBusy(true);

    try {
      let attachmentIds: string[] = [];

      // 1) presign + upload files (if any)
      if (selected.length) {
        const pres = await fetch(`/api/projects/${projectId}/files/presign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            files: selected.map((f) => ({
              filename: f.name,
              mimeType: f.type || "application/octet-stream",
              size: f.size,
            })),
          }),
        });

        if (!pres.ok) {
          const err = await pres.json().catch(() => ({}));
          throw new Error(err.error || "presign_failed");
        }

        const presData = await pres.json();

        // PUT each file to S3
        await Promise.all(
          presData.files.map(async (p: any, idx: number) => {
            const f = selected[idx];
            const up = await fetch(p.uploadUrl, {
              method: "PUT",
              headers: { "Content-Type": f.type || "application/octet-stream" },
              body: f,
            });
            if (!up.ok) throw new Error("upload_failed");
          }),
        );

        attachmentIds = presData.files.map((p: any) => p.fileId);
      }

      // 2) send the message with attachmentIds
      const res = await fetch(
        `/api/projects/${projectId}/discussions/threads/${threadId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            body: text || "",
            bodyJson: null,
            attachmentIds,
          }),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "send_failed");
      }

      const newMessage = await res.json();
      onSent?.(newMessage);

      // reset input + file picker
      setValue("");
      setFiles(null);
      if (fileRef.current) fileRef.current.value = "";
    } finally {
      setBusy(false);
    }
  }

  const showMentionList = mentionOpen && mentionResults.length > 0;

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <div className="relative">
          {value ? (
            <div className="pointer-events-none absolute inset-0 flex items-center px-3 pr-28 text-sm">
              <div className="w-full truncate">
                {renderMentionsInline(value)}
              </div>
            </div>
          ) : null}
          <Input
            className="h-10 pr-28 caret-foreground text-transparent [text-shadow:none] selection:text-transparent"
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Message — use @ to mention, Win + '.' to add emoji"
            onKeyDown={(e) => {
              const el = e.currentTarget;

              const cursor = el.selectionStart ?? 0;
              const selEnd = el.selectionEnd ?? cursor;

              // If user selected a range, let normal deletion happen
              if (selEnd !== cursor) return;

              if (e.key === "Backspace") {
                const hit = findMentionForBackspace(value, cursor);
                if (!hit) return;

                e.preventDefault();

                const next = value.slice(0, hit.start) + value.slice(hit.end);
                setValue(next);

                requestAnimationFrame(() => {
                  inputRef.current?.setSelectionRange(hit.start, hit.start);
                });
                return;
              }

              if (e.key === "Delete") {
                const hit = findMentionForDelete(value, cursor);
                if (!hit) return;

                e.preventDefault();

                const next = value.slice(0, hit.start) + value.slice(hit.end);
                setValue(next);

                requestAnimationFrame(() => {
                  inputRef.current?.setSelectionRange(hit.start, hit.start);
                });
              }
              if (showMentionList) {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveIndex((i) =>
                    Math.min(i + 1, mentionResults.length - 1),
                  );
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveIndex((i) => Math.max(i - 1, 0));
                  return;
                }
                if (e.key === "Enter") {
                  e.preventDefault();
                  const u = mentionResults[activeIndex];
                  if (u) insertMention(u);
                  return;
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setMentionOpen(false);
                  return;
                }
              }

              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />

          {/* mention dropdown */}
          {showMentionList ? (
            <div className="absolute left-0 right-0 bottom-12 z-50 rounded-xl border bg-background shadow-md overflow-hidden">
              <div className="px-3 py-2 text-xs text-muted-foreground border-b">
                mention someone
              </div>
              <div className="max-h-56 overflow-y-auto">
                {mentionResults.map((u, idx) => (
                  <button
                    key={u.id}
                    type="button"
                    className={[
                      "w-full text-left px-3 py-2 text-sm",
                      idx === activeIndex ? "bg-muted" : "hover:bg-muted/60",
                    ].join(" ")}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => insertMention(u)}
                  >
                    @{fullName(u)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
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

            <Button
              size="icon"
              disabled={busy}
              onClick={() => void send()}
              type="button"
            >
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
