"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";


export function CreateThreadDialog({ open, onOpenChange, projectId, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; projectId: string; onCreated?: () => void; }) {
const [topic, setTopic] = useState("");
const [description, setDescription] = useState("");
const [busy, setBusy] = useState(false);


async function handleCreate() {
if (!topic.trim()) return;
setBusy(true);
try {
const res = await fetch(`/api/projects/${projectId}/discussions/threads`, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ topic, description })
});
const json = await res.json();
onOpenChange(false);
onCreated?.();
 window.location.href = `/projects/${projectId}/discussions/threads/${json.id}`;
} finally {
setBusy(false);
}
}


return (
<Dialog open={open} onOpenChange={onOpenChange}>
<DialogContent className="sm:max-w-lg">
<DialogHeader>
<DialogTitle>Start a new thread</DialogTitle>
<DialogDescription>Group your conversation by topic so teammates can join in.</DialogDescription>
</DialogHeader>
<div className="space-y-4">
<div className="grid gap-2">
<Label htmlFor="topic">Topic</Label>
<Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Kickoff agenda" />
</div>
<div className="grid gap-2">
<Label htmlFor="description">Description (optional)</Label>
<Textarea id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this thread about?" />
</div>
</div>
<DialogFooter>
<Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
<Button onClick={handleCreate} disabled={!topic.trim() || busy}>Create & Open</Button>
</DialogFooter>
</DialogContent>
</Dialog>
);
}