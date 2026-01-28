"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type RagCitation } from "./types";

export function Sources({ citations }: { citations: RagCitation[] }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="text-xs text-muted-foreground">
          Sources • {citations.length}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide" : "Show"}
        </Button>
      </div>

      {open ? (
        <div className="space-y-2 px-3 pb-3">
          {citations.map((c, idx) => (
            <div
              key={`${c.sourceType}-${c.sourceId}-${c.chunkIndex}-${idx}`}
              className="rounded-lg border p-2"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="secondary">{c.sourceType}</Badge>
                <span className="text-muted-foreground">id:</span>
                <code className="text-xs">{c.sourceId}</code>
                <span className="text-muted-foreground">chunk:</span>
                <code className="text-xs">{c.chunkIndex}</code>
                <span className="text-muted-foreground">dist:</span>
                <code className="text-xs">{c.distance.toFixed(4)}</code>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
