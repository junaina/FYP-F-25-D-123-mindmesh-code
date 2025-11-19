"use client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BellOff, MessageSquare } from "lucide-react";
import type { ThreadListItem } from "@/components/types/discussions";

export function ThreadCard({ thread }: { thread: ThreadListItem }) {
const initials = `${thread.createdBy.firstName?.[0] ?? ""}${thread.createdBy.lastName?.[0] ?? ""}` || "?";
return (
<Card className="p-4 hover:shadow-md transition cursor-pointer group">
<div className="flex items-start justify-between">
<div className="flex items-start gap-3">
<Avatar className="h-8 w-8 mt-1">
<AvatarImage src={thread.createdBy.avatarUrl ?? undefined} />
<AvatarFallback>{initials}</AvatarFallback>
</Avatar>
<div>
<h3 className="font-medium leading-tight group-hover:underline">{thread.topic}</h3>
{thread.description ? (
<p className="text-sm text-muted-foreground line-clamp-2">{thread.description}</p>
) : (
<p className="text-sm text-muted-foreground">No description</p>
)}
<div className="mt-2 text-xs text-muted-foreground flex gap-3">
<span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" />{thread.unreadCount ?? 0} unread</span>
<span>{thread.memberCount ?? 1} members</span>
</div>
</div>
</div>
{thread.isMuted ? <BellOff className="h-4 w-4 opacity-60" /> : null}
</div>
</Card>
);
}