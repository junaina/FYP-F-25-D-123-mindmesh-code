"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type SlackStatusResponse = {
  connected: boolean;
  // your Postman shows: { connected, user, team }
  user?: string;
  team?: string;
};

type SlackChannel = {
  id: string;
  name: string;
  isPrivate?: boolean;
};

type SlackChannelsResponse = {
  channels: SlackChannel[];
};

type SlackSendRequest = {
  channelId: string;
  text: string;
};

type SlackSendResponse = {
  ok: boolean;
  channelId: string;
  ts?: string;
  permalink?: string;
  // optional if you ever add it later
  channelName?: string;
};

export type SlackInlinePromptRange = { from: number; to: number };

type Props = {
  open: boolean;

  /**
   * These come from coordsAtPos(...) in EditorWrapper.
   * We'll clamp them so the dialog stays fully visible.
   */
  top: number;
  left: number;

  projectId: string;
  docId: string;

  insertRange: SlackInlinePromptRange;
  onClose: () => void;

  onSent?: (payload: {
    channelId: string;
    channelName: string;
    text: string;
    permalink?: string;
    ts?: string;
    teamName?: string;
    userId?: string;
  }) => void;
};

const PANEL_WIDTH = 380;
const VIEWPORT_PAD = 12;

export default function SlackSendInlineForm(props: Props) {
  const { open, top, left, projectId, docId, onClose, onSent } = props;

  // ---- hooks MUST be unconditional (Rules of Hooks) ----
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = React.useState(false);

  const [status, setStatus] = React.useState<SlackStatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = React.useState(false);

  const [channels, setChannels] = React.useState<SlackChannel[]>([]);
  const [channelsLoading, setChannelsLoading] = React.useState(false);

  const [channelFilter, setChannelFilter] = React.useState("");
  const [selectedChannelId, setSelectedChannelId] = React.useState<string>("");

  const [text, setText] = React.useState("");
  const [sendLoading, setSendLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [pos, setPos] = React.useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  // portal mount flag (avoids SSR mismatch)
  React.useEffect(() => setMounted(true), []);

  const filteredChannels = React.useMemo(() => {
    const q = channelFilter.trim().toLowerCase();
    if (!q) return channels;
    return channels.filter((c) => c.name.toLowerCase().includes(q));
  }, [channels, channelFilter]);

  const fetchStatus = React.useCallback(async () => {
    setStatusLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/slack/status", {
        method: "GET",
        credentials: "include",
        headers: { "cache-control": "no-store" },
      });
      if (!res.ok) throw new Error(`status failed: ${res.status}`);
      const json = (await res.json()) as SlackStatusResponse;
      setStatus(json);
      return json;
    } catch (e: any) {
      const fallback: SlackStatusResponse = { connected: false };
      setStatus(fallback);
      setError(e?.message ?? "Failed to check Slack status");
      return fallback;
    } finally {
      setStatusLoading(false);
    }
  }, []);

  const fetchChannels = React.useCallback(async () => {
    setChannelsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/slack/channels", {
        method: "GET",
        credentials: "include",
        headers: { "cache-control": "no-store" },
      });
      if (!res.ok) throw new Error(`channels failed: ${res.status}`);
      const json = (await res.json()) as SlackChannelsResponse;

      const list = json.channels ?? [];
      setChannels(list);

      if (!selectedChannelId && list.length) {
        setSelectedChannelId(list[0].id);
      }
    } catch (e: any) {
      setChannels([]);
      setError(e?.message ?? "Failed to load channels");
    } finally {
      setChannelsLoading(false);
    }
  }, [selectedChannelId]);

  // open: load status + channels
  React.useEffect(() => {
    if (!open) return;

    // reset UI every time dialog opens
    setError(null);
    setChannelFilter("");

    (async () => {
      const st = await fetchStatus();
      if (st.connected) await fetchChannels();
    })();
  }, [open, fetchStatus, fetchChannels]);

  // keyboard shortcuts (Esc to close, Ctrl/Cmd+Enter to send)
  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        void sendMessage();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose, selectedChannelId, text, status, channels]);

  // position + clamping to keep dialog fully in viewport
  React.useLayoutEffect(() => {
    if (!open) return;

    const clamp = () => {
      const panel = panelRef.current;
      const height = panel?.getBoundingClientRect().height ?? 320;

      let nextLeft = left;
      let nextTop = top;

      // Default clamp
      nextLeft = Math.max(
        VIEWPORT_PAD,
        Math.min(nextLeft, window.innerWidth - PANEL_WIDTH - VIEWPORT_PAD),
      );

      // If it overflows bottom, flip above the caret-ish anchor
      const maxTop = window.innerHeight - height - VIEWPORT_PAD;
      if (nextTop > maxTop) {
        nextTop = Math.max(VIEWPORT_PAD, maxTop);
      }
      nextTop = Math.max(VIEWPORT_PAD, nextTop);

      setPos({ top: nextTop, left: nextLeft });
    };

    clamp();
    window.addEventListener("resize", clamp, { passive: true });

    // If the user scrolls, keep it visible (re-clamp).
    // (This makes it feel like a proper floating dialog instead of "lost".)
    window.addEventListener("scroll", clamp, { passive: true });

    return () => {
      window.removeEventListener("resize", clamp);
      window.removeEventListener("scroll", clamp);
    };
  }, [open, top, left]);

  const connectSlack = React.useCallback(() => {
    const returnTo = `/projects/${projectId}/docs/${docId}?slack=connected`;
    const url = `/api/integrations/slack/start?returnTo=${encodeURIComponent(returnTo)}`;
    window.location.assign(url);
  }, [projectId, docId]);

  const sendMessage = React.useCallback(async () => {
    setSendLoading(true);
    setError(null);

    try {
      const payload: SlackSendRequest = {
        channelId: selectedChannelId,
        text: text.trim(),
      };

      if (!payload.channelId) throw new Error("Pick a channel");
      if (!payload.text) throw new Error("Write a message first");

      // IMPORTANT: your backend route is /post (per your Postman)
      const res = await fetch("/api/integrations/slack/post", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`send failed: ${res.status}`);
      const json = (await res.json()) as SlackSendResponse;
      if (!json.ok) throw new Error("Slack send failed");

      const channelName =
        json.channelName ??
        channels.find((c) => c.id === payload.channelId)?.name ??
        "channel";

      onSent?.({
        channelId: payload.channelId,
        channelName,
        text: payload.text,
        permalink: json.permalink,
        ts: json.ts,
        teamName: status?.team,
        userId: status?.user,
      });

      setText("");
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Failed to send message");
    } finally {
      setSendLoading(false);
    }
  }, [channels, onClose, onSent, selectedChannelId, status, text]);

  // ---- render nothing if closed OR portal not mounted yet ----
  if (!open || !mounted) return null;

  const ui = (
    <>
      {/* overlay (click outside to close) */}
      <div
        className="fixed inset-0 z-50 bg-black/20"
        onMouseDown={(e) => {
          // only close if the backdrop itself was clicked
          if (e.target === e.currentTarget) onClose();
        }}
      />

      {/* panel */}
      <div
        ref={panelRef}
        className="fixed z-50"
        style={{ top: pos.top, left: pos.left, width: PANEL_WIDTH }}
        role="dialog"
        aria-modal="true"
      >
        <div className="rounded-lg border bg-background shadow-xl">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div className="text-sm font-medium">Send to Slack</div>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3 p-3 max-h-[70vh] overflow-auto">
            {error ? (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {error}
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                {statusLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Checking connection…
                  </span>
                ) : status?.connected ? (
                  <span>Connected{status.team ? ` • ${status.team}` : ""}</span>
                ) : (
                  <span>Not connected</span>
                )}
              </div>

              <Button
                size="sm"
                variant={status?.connected ? "secondary" : "default"}
                onClick={status?.connected ? fetchStatus : connectSlack}
                disabled={statusLoading}
              >
                {status?.connected ? "Refresh" : "Connect"}
              </Button>
            </div>

            {!status?.connected ? (
              <div className="text-xs text-muted-foreground">
                Connect Slack to pick a channel and send messages from inside a
                doc.
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="text-xs font-medium">Channel</div>
                  <Input
                    value={channelFilter}
                    onChange={(e) => setChannelFilter(e.target.value)}
                    placeholder="Filter channels…"
                    className="h-8"
                  />

                  <div
                    className={cn(
                      "rounded-md border",
                      channelsLoading && "opacity-70",
                    )}
                  >
                    <select
                      className="h-9 w-full bg-popover text-popover-foreground px-2 text-sm outline-none"
                      value={selectedChannelId}
                      onChange={(e) => setSelectedChannelId(e.target.value)}
                      disabled={channelsLoading}
                    >
                      {filteredChannels.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.isPrivate ? "🔒 " : "# "}
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {channelsLoading ? (
                    <div className="text-xs text-muted-foreground inline-flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading channels…
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium">Message</div>
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Write your message…"
                    className="min-h-[110px]"
                  />
                  <div className="text-[11px] text-muted-foreground">
                    Tip: Ctrl/Cmd + Enter to send
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button size="sm" variant="ghost" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => void sendMessage()}
                    disabled={sendLoading}
                  >
                    {sendLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Sending…
                      </span>
                    ) : (
                      "Send"
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(ui, document.body);
}
