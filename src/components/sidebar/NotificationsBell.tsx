"use client";

import useSWR from "swr";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function initials(u: any) {
  const a = u?.firstName?.[0] ?? "";
  const b = u?.lastName?.[0] ?? "";
  return a + b || "?";
}

export function NotificationsBell() {
  const { data, mutate } = useSWR("/api/notifications?limit=20", fetcher, {
    refreshInterval: 25000, // checkbox-worthy polling
    revalidateOnFocus: true,
  });

  const unread = data?.unreadCount ?? 0;
  const items = data?.items ?? [];

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    mutate();
  }

  async function markOne(id: string) {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    mutate();
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 ? (
            <span className="absolute -top-1 -right-1 rounded-full bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5">
              {unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-2">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="text-sm font-medium">Notifications</div>
          {unread > 0 ? (
            <button
              className="text-xs underline opacity-80"
              onClick={markAllRead}
            >
              Mark all read
            </button>
          ) : null}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {items.length ? (
            items.map((n: any) => (
              <Link
                key={n.id}
                href={n.url ?? "#"}
                className={`flex gap-2 rounded-lg px-2 py-2 hover:bg-muted ${
                  n.readAt ? "opacity-70" : ""
                }`}
                onClick={() => markOne(n.id)}
              >
                <Avatar className="h-7 w-7 mt-0.5">
                  <AvatarImage src={n.actor?.avatarUrl ?? undefined} />
                  <AvatarFallback>{initials(n.actor)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-sm font-medium">{n.title}</div>
                  {n.bodyPreview ? (
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {n.bodyPreview}
                    </div>
                  ) : null}
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="px-2 py-6 text-sm text-muted-foreground">
              No notifications yet.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
