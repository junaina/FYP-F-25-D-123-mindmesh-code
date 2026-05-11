"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  FileText,
  MessageSquare,
  LayoutGrid,
  Plus,
  Loader2,
  Bot,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type DocLite = { id: string; title: string | null };
type ProjectLite = { id: string; name: string };
type ThreadLite = { id: string; title?: string | null };

export default function ProjectHomePage() {
  const router = useRouter();
  const params = useParams<{ projectId: string }>();
  const projectId = params?.projectId ?? "";

  const [projectName, setProjectName] = React.useState<string>("Project");
  const [docs, setDocs] = React.useState<DocLite[] | null>(null);
  const [threadsCount, setThreadsCount] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [creatingDoc, setCreatingDoc] = React.useState(false);
  const [q, setQ] = React.useState("");

  const filteredDocs = React.useMemo(() => {
    if (!docs) return [];
    const query = q.trim().toLowerCase();
    if (!query) return docs;
    return docs.filter((d) =>
      (d.title || "Untitled").toLowerCase().includes(query),
    );
  }, [docs, q]);

  React.useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      try {
        // 1) Project name (best effort) — your app already lists projects for sidebar
        const pRes = await fetch("/api/projects", { credentials: "include" });
        if (pRes.ok) {
          const list = (await pRes.json()) as ProjectLite[];
          const found = list?.find((p) => p.id === projectId);
          if (alive && found?.name) setProjectName(found.name);
        }

        // 2) Docs lite
        const dRes = await fetch(`/api/projects/${projectId}/docs?lite=1`, {
          credentials: "include",
        });
        if (!dRes.ok) throw new Error("Failed to load docs");
        const d = (await dRes.json()) as DocLite[];
        if (alive) setDocs(d);

        // 3) Threads count (optional preview)
        const tRes = await fetch(
          `/api/projects/${projectId}/discussions/threads`,
          {
            credentials: "include",
          },
        );
        if (tRes.ok) {
          const payload = (await tRes.json()) as { threads?: ThreadLite[] };
          if (alive) setThreadsCount(payload?.threads?.length ?? 0);
        } else {
          if (alive) setThreadsCount(null);
        }
      } catch (e) {
        console.error(e);
        if (alive) {
          setDocs([]);
          setThreadsCount(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [projectId]);

  async function createDoc() {
    try {
      setCreatingDoc(true);
      const r = await fetch(`/api/projects/${projectId}/docs`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: "Untitled" }),
      });
      if (!r.ok) throw new Error("Failed to create document");
      const doc = (await r.json()) as { id: string; title: string | null };

      // optimistic insert at top
      setDocs((prev) => [{ id: doc.id, title: doc.title }, ...(prev ?? [])]);

      router.push(`/projects/${projectId}/docs/${doc.id}`);
    } catch (e) {
      console.error(e);
      alert("Could not create document");
    } finally {
      setCreatingDoc(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold leading-tight">
            {projectName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Jump into your workspace.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={createDoc} disabled={creatingDoc}>
            {creatingDoc ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            New document
          </Button>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid gap-3 md:grid-cols-3">
        <Link href={`/projects/${projectId}/task-board`} className="block">
          <Card className="hover:bg-muted/30 transition">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5" />
                Task Board
              </CardTitle>
              <CardDescription>
                Plan work, track tasks, and progress.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Open board →</div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/projects/${projectId}/discussions`} className="block">
          <Card className="hover:bg-muted/30 transition">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Discussions
              </CardTitle>
              <CardDescription>
                {threadsCount == null
                  ? "Threads, decisions, and updates."
                  : `${threadsCount} thread${threadsCount === 1 ? "" : "s"}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Open discussions →
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/projects/${projectId}/ask-mindy`} className="block">
          <Card className="hover:bg-muted/30 transition">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Ask Mindy
              </CardTitle>
              <CardDescription>
                Ask questions and get answers with sources.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Open chat →</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Documents */}
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents
              </CardTitle>
              <CardDescription>All docs in this project.</CardDescription>
            </div>

            <div className="w-full md:w-80">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search documents…"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <div className="h-4 w-64 bg-muted rounded animate-pulse" />
              <div className="h-4 w-72 bg-muted rounded animate-pulse" />
              <div className="h-4 w-56 bg-muted rounded animate-pulse" />
            </div>
          ) : !docs || docs.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No documents yet. Create your first one.
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-sm text-muted-foreground">No matches.</div>
          ) : (
            <div className="divide-y rounded-md border">
              {filteredDocs.map((d) => (
                <Link
                  key={d.id}
                  href={`/projects/${projectId}/docs/${d.id}`}
                  className="flex items-center justify-between px-3 py-2 hover:bg-muted/30 transition"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {d.title || "Untitled"}
                    </div>
                    {/* <div className="text-xs text-muted-foreground truncate">
                      /projects/{projectId}/docs/{d.id}
                    </div> */}
                  </div>
                  <div className="text-xs text-muted-foreground">Open →</div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
