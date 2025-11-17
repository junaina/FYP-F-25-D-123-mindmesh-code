"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { MessageDTO } from "@/components/types/discussions";


export function ReactionBar({ message, threadId, onChange }: { message: MessageDTO; threadId: string; onChange?: () => void; }) {
const [pending, setPending] = useState(false);
const emojis = message.reactions?.length ? message.reactions : [];


async function toggle(emoji: string) {
if (pending) return;
setPending(true);
try {
await fetch(`/api/threads/${threadId}/messages/${message.id}/reactions`, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ emoji })
});
onChange?.();
} finally {
setPending(false);
}
}


return (
<div className="mt-2 flex items-center gap-2 opacity-80">
{emojis.map((r) => (
<Button key={r.emoji} size="sm" variant={r.reactedByMe ? "secondary" : "outline"} onClick={() => toggle(r.emoji)}>
<span className="mr-1">{r.emoji}</span>
{r.count}
</Button>
))}
<Button size="sm" variant="outline" onClick={() => toggle("👍")}>
＋
</Button>
</div>
);
}