"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Plus, MessageSquare, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CreateThreadDialog } from "@/components/discussions/CreateThreadDialog";
import { ThreadCard } from "@/components/discussions/ThreadCard";
import type { ThreadListItem } from "@/components/types/discussions";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DiscussionsClient({ projectId }: { projectId: string }) {
  const { data, isLoading, mutate } = useSWR<{ threads: ThreadListItem[] }>(
    `/api/projects/${projectId}/discussions/threads`,
    fetcher
  );

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const threads = useMemo(() => {
    const list = data?.threads ?? [];
    if (!query) return list;
    const q = query.toLowerCase();
    return list.filter((t) =>
      [t.topic, t.description ?? ""].some((x) => x.toLowerCase().includes(q))
    );
  }, [data, query]);

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6" />
          <h1 className="text-2xl font-semibold">Discussions</h1>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Thread
        </Button>
      </header>

      <div className="relative w-full max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
        <Input
          className="pl-9"
          placeholder="Search by topic or description"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-28 animate-pulse bg-muted" />
          ))}
        </div>
      ) : threads.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {threads.map((t: ThreadListItem) => (
            <Link
              key={t.id}
              href={`/projects/${projectId}/discussions/threads/${t.id}`}
            >
              <ThreadCard thread={t} />
            </Link>
          ))}
        </div>
      ) : (
        <Card className="p-8 flex items-center justify-center">
          <CardContent className="text-center space-y-2">
            <p className="text-muted-foreground">No threads yet.</p>
            <Button onClick={() => setOpen(true)} className="mt-2">
              <Plus className="h-4 w-4 mr-2" /> Create your first thread
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateThreadDialog
        open={open}
        onOpenChange={setOpen}
        projectId={projectId}
        onCreated={() => mutate()}
      />
    </div>
  );
}
