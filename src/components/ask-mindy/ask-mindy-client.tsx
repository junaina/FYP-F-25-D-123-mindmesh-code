"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

import { type ChatMessage, type RagCitation, uid } from "./types";
import { Sources } from "./sources";

type Props = {
  projectId: string;
  embedded?: boolean;
  onOpenSource?: (c: RagCitation) => void;
};
export default function AskMindyClient({
  projectId,
  embedded = false,
  onOpenSource,
}: Props) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [draft, setDraft] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // simple controls (can hide behind the popover)
  const [topK, setTopK] = React.useState(6);
  const [minChars, setMinChars] = React.useState(80);

  // index status (lightweight)
  const [indexing, setIndexing] = React.useState(false);
  const [lastIndexStats, setLastIndexStats] = React.useState<any>(null);

  const scrollerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    // auto-scroll on new messages
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  async function send() {
    const q = draft.trim();
    if (!q || busy) return;

    setError(null);
    setBusy(true);

    const userMsg: ChatMessage = { id: uid(), role: "user", content: q };
    const assistantMsgId = uid();
    const thinkingMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "Thinking…",
      pending: true,
    };

    setMessages((m) => [...m, userMsg, thinkingMsg]);
    setDraft("");

    try {
      const res = await fetch(`/api/projects/${projectId}/rag/answer_project`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: q, topK, minChars }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      if (!res.ok) {
        const detail = data?.detail || data?.error || "Request failed";
        throw new Error(
          typeof detail === "string" ? detail : JSON.stringify(detail),
        );
      }

      const answer = typeof data?.answer === "string" ? data.answer : "";
      const citations: RagCitation[] = Array.isArray(data?.citations)
        ? data.citations
        : [];

      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: answer || "No answer returned.",
                pending: false,
                citations,
              }
            : msg,
        ),
      );
    } catch (e) {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, content: "Something went wrong.", pending: false }
            : msg,
        ),
      );
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function indexProject() {
    if (indexing) return;
    setIndexing(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/rag/index_project`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chunkSize: 1000, overlap: 150 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data?.detail || data?.error || "Indexing failed");
      setLastIndexStats(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setIndexing(false);
    }
  }

  const hasMessages = messages.length > 0;
  const outer = embedded ? "h-full min-h-0" : "h-[calc(100vh-1rem)]";
  return (
    <div className={`${outer} w-full`}>
      <div className="mx-auto flex h-full max-w-3xl flex-col px-4 py-4">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 overflow-hidden rounded-full border bg-card">
              <Image
                src="/ask-mindy.png"
                alt="Ask Mindy"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Ask Mindy</div>
              <div className="text-xs text-muted-foreground">
                Project RAG assistant
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                >
                  Controls
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72">
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-medium">topK</div>
                    <Input
                      value={String(topK)}
                      onChange={(e) =>
                        setTopK(
                          Math.max(
                            1,
                            Math.min(20, Number(e.target.value) || 6),
                          ),
                        )
                      }
                      inputMode="numeric"
                    />
                    <div className="mt-1 text-xs text-muted-foreground">
                      How many chunks to retrieve
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium">minChars</div>
                    <Input
                      value={String(minChars)}
                      onChange={(e) =>
                        setMinChars(Math.max(0, Number(e.target.value) || 80))
                      }
                      inputMode="numeric"
                    />
                    <div className="mt-1 text-xs text-muted-foreground">
                      Filter tiny chunks before answering
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover> */}

            <Button
              variant="outline"
              size="sm"
              onClick={indexProject}
              disabled={indexing}
            >
              {indexing ? "Refreshing…" : "Refresh project"}
            </Button>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Optional: show last index stats */}
        {/* {lastIndexStats ? (
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">Indexed</Badge>
            <span>sourcesIndexed: {lastIndexStats.sourcesIndexed ?? "?"}</span>
            <span>sourcesSkipped: {lastIndexStats.sourcesSkipped ?? "?"}</span>
            <span>chunksInserted: {lastIndexStats.chunksInserted ?? "?"}</span>
          </div>
        ) : null} */}

        {/* Errors */}
        {error ? (
          <div className="mb-3 rounded-lg border bg-card p-3 text-sm">
            <div className="font-medium">Error</div>
            <div className="mt-1 text-muted-foreground">{error}</div>
          </div>
        ) : null}

        {/* Chat area */}
        <div className="relative flex-1 min-h-0">
          <div ref={scrollerRef} className="h-full overflow-y-auto pr-2">
            {!hasMessages ? (
              <EmptyState />
            ) : (
              <div className="space-y-6 pb-6">
                {messages.map((m) => (
                  <MessageRow key={m.id} msg={m} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="mt-4 rounded-2xl border bg-card p-3">
          <div className="flex items-end gap-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about this project…"
              className="min-h-[44px] resize-none border-0 bg-transparent focus-visible:ring-0"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <Button onClick={send} disabled={busy || !draft.trim()}>
              Send
            </Button>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Enter to send • Shift+Enter for newline
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ embedded }: { embedded?: boolean }) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center text-center",
        embedded ? "h-full" : "h-[70vh]",
      ].join(" ")}
    >
      <div className="relative mb-4 h-25 w-25 overflow-hidden ">
        <Image
          src="/ask-mindy.png"
          alt="Ask Mindy"
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="text-lg font-semibold">Ask Mindy</div>
      <div className="mt-1 max-w-md text-sm text-muted-foreground">
        Ask questions about your project’s docs and meeting transcripts. Index
        the project once, then chat.
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Badge variant="secondary">“Summarise the project status”</Badge>
        <Badge variant="secondary">
          “What decisions were made last sprint?”
        </Badge>
        <Badge variant="secondary">“Where is the auth logic documented?”</Badge>
      </div>
    </div>
  );
}

function MessageRow({
  msg,
  embedded,
  onOpenSource,
}: {
  msg: ChatMessage;
  embedded?: boolean;
  onOpenSource?: (c: RagCitation) => void;
}) {
  const isUser = msg.role === "user";

  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div className={isUser ? "w-full max-w-[85%]" : "w-full max-w-[85%]"}>
        <div
          className={[
            "rounded-2xl border px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "ml-auto bg-primary text-primary-foreground"
              : "bg-card text-foreground",
          ].join(" ")}
        >
          {msg.content}
        </div>

        {!isUser && msg.citations?.length ? (
          <div className="mt-2">
            <Sources
              citations={msg.citations}
              embedded={embedded}
              onOpenSource={onOpenSource}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
