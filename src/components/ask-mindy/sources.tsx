"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type RagCitation } from "./types";

function uniqueBest(citations: RagCitation[]) {
  // Dedupe by (sourceType, sourceId), keep the smallest distance
  const map = new Map<string, RagCitation>();
  for (const c of citations) {
    const key = `${c.sourceType}:${c.sourceId}`;
    const prev = map.get(key);
    if (!prev || c.distance < prev.distance) map.set(key, c);
  }
  return Array.from(map.values()).sort((a, b) => a.distance - b.distance);
}

export function Sources({ citations }: { citations: RagCitation[] }) {
  const [open, setOpen] = React.useState(false);

  const items = React.useMemo(() => uniqueBest(citations), [citations]);

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="text-xs text-muted-foreground">
          Top Sources • {items.length}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide" : "Show"}
        </Button>
      </div>

      {open ? (
        <div className="space-y-2 px-3 pb-3">
          {items.map((c) => {
            const title = c.sourceTitle ?? "Document";
            const href = c.href;

            return (
              <div
                key={`${c.sourceType}-${c.sourceId}`}
                className="rounded-lg border px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {c.sourceType}
                  </Badge>

                  {href ? (
                    <Link
                      href={href}
                      className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
                      title={title}
                    >
                      {title}
                    </Link>
                  ) : (
                    <div
                      className="min-w-0 flex-1 truncate text-sm font-medium"
                      title={title}
                    >
                      {title}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
