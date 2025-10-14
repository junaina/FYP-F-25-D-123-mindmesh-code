"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateTimelineEvent } from "@/modules/timeline/client/useCreateTimeline";
import { timelineKeys } from "@/modules/timeline/client/keys";
// NOTE: use the path where you saved it
import { DateTimeField } from "@/components/ui/DateTimeField";

type View = "hour" | "day" | "week" | "month";

export function NewEventButton({
  projectId,
  docId,
  collectionId,
  view,
  startISO, // normalized viewport start (from TimelineView)
}: {
  projectId: string;
  docId: string;
  collectionId: string;
  view: View;
  startISO: string;
}) {
  const qc = useQueryClient();
  const create = useCreateTimelineEvent({ projectId, docId, collectionId });

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("Untitled");

  // derive sensible defaults from current view/startISO
  const [defaultStart, defaultEnd] = useMemo(() => {
    const base = new Date(startISO);
    const s = new Date(base);
    const e = new Date(base);
    if (view === "hour" || view === "day") {
      e.setHours(e.getHours() + 1);
    } else {
      e.setDate(e.getDate() + 1);
    }
    return [s.toISOString(), e.toISOString()] as const;
  }, [view, startISO]);

  // ISO state that the DateTimeField edits
  const [startISOState, setStartISOState] = useState<string>(defaultStart);
  const [endISOState, setEndISOState] = useState<string>(defaultEnd);

  async function handleCreate() {
    await create.mutateAsync({
      title,
      start: startISOState,
      end: endISOState,
    });

    // Re-fetch the list you're currently viewing (5-arg key)
    qc.invalidateQueries({
      queryKey: timelineKeys.events(
        projectId,
        docId,
        collectionId,
        view,
        startISO
      ),
    });

    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" className="mx-2">
          New
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px]">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Start</label>
              <DateTimeField
                value={startISOState}
                onChange={setStartISOState}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">End</label>
              <DateTimeField value={endISOState} onChange={setEndISOState} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
