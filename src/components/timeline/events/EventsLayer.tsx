"use client";
import EventChip from "./EventChip";
import type { TimelinePropertyDef } from "@/modules/timeline/dto/timeline.dto";
import { makePropertyDisplayMapper, type PropertyOptionsMap } from "./adapters";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useDeleteTimelineEvent } from "@/modules/timeline/client/useDeleteTimelineEvent";
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
type TimelineEventDto = {
  id: string;
  documentId: string;
  title: string;
  start: string;
  end: string;
  properties?: Array<{ name: string; value: unknown }>;
};
type Props = {
  events: TimelineEventDto[];
  startMs: number;
  endMs: number;
  contentWidth: number;
  rowHeight?: number; // base min height for a lane
  maxVisibleRows?: number; // (kept for API compat, not used anymore)
  propertyVisible?: Set<string>;
  propertyDefs?: TimelinePropertyDef[];
  propertyOptions?: PropertyOptionsMap;
  onOpenDoc?: (docId: string) => void;
  projectId?: string;
  docId?: string;
  collectionId?: string;
  metaByName?: Map<
    string,
    {
      id: string;
      name: string;
      kind: string;
      options?: { id: string; value: string; color?: string | null }[];
    }
  >;
};

export default function EventsLayer({
  events,
  startMs,
  endMs,
  contentWidth,
  rowHeight = 50, // base min
  // maxVisibleRows = 6,  // no longer used for sizing
  propertyVisible,
  propertyDefs,
  propertyOptions,
  onOpenDoc,
  projectId,
  docId,
  collectionId,
  metaByName,
}: Props) {
  const spanMs = Math.max(1, endMs - startMs);

  // --- 1) Pre-normalise and keep only events intersecting the viewport
  const normalized = events
    .map((e) => ({
      ...e,
      _s: new Date(e.start).getTime(),
      _e: new Date(e.end).getTime(),
    }))
    .filter((e) => e._e > startMs && e._s < endMs)
    .sort((a, b) => a._s - b._s);

  // --- 2) Estimate chip height to derive a *lane height* that will work for all chips
  // Numbers tuned to your current chip CSS (feel free to tweak):
  const CHIP_TITLE_H = 22; // text height for title
  const CHIP_PROP_H = 28; // height of one visible property pill
  const CHIP_VPAD = 12; // vertical paddings inside chip
  const LANE_GAP = 8; // gap between lanes (vertical)

  const getVisiblePropCount = (props?: { name: string; value: unknown }[]) => {
    if (!props) return 0;
    if (!propertyVisible || propertyVisible.size === 0) return 0;
    let c = 0;
    for (const p of props) if (propertyVisible.has(p.name)) c++;
    return c;
  };

  const estimateChipHeight = (evt: TimelineEventDto) => {
    const n = getVisiblePropCount(evt.properties as any);
    return CHIP_VPAD + CHIP_TITLE_H + n * CHIP_PROP_H;
  };

  const tallestChip = normalized.reduce(
    (m, e) => Math.max(m, estimateChipHeight(e)),
    rowHeight
  );

  // This is the lane height we will use for *all* lanes.
  const laneHeight = Math.max(rowHeight, tallestChip) + LANE_GAP;

  // --- 3) Interval-packing into lanes (greedy) using that fixed laneHeight
  type Placed = TimelineEventDto & {
    lane: number;
    leftPx: number;
    widthPx: number;
    isCompact: boolean;
  };

  const lanesEnd: number[] = []; // per-lane last end time
  const placed: Placed[] = [];

  for (const e of normalized) {
    // clamp to viewport
    const s = Math.max(startMs, Math.min(endMs, e._s));
    const t = Math.max(startMs, Math.min(endMs, e._e));

    const leftPx = ((s - startMs) / spanMs) * contentWidth;
    const widthPx = Math.max(
      8,
      ((t - startMs) / spanMs) * contentWidth - leftPx
    );

    const COMPACT_THRESHOLD = 48;
    const isCompact = widthPx < COMPACT_THRESHOLD;
    const visualWidth = Math.max(6, widthPx);

    // choose the first free lane
    let lane = 0;
    while (lane < lanesEnd.length && lanesEnd[lane] > e._s) lane++;
    lanesEnd[lane] = Math.max(lanesEnd[lane] ?? 0, e._e);

    placed.push({ ...e, lane, leftPx, widthPx: visualWidth, isCompact });
  }

  const lanesCount = lanesEnd.length;
  const contentHeight = Math.max(lanesCount * laneHeight, laneHeight);
  // --- NEW: build id->label resolver once
  const resolve = useMemo(
    () => makePropertyDisplayMapper(propertyDefs ?? [], propertyOptions ?? {}),
    [propertyDefs, propertyOptions]
  );

  // keep raw IDs / arrays; only filter by visibility
  function visibleValues(row: {
    start: string;
    end: string;
    properties?: Array<{ name: string; value: unknown }>;
  }): Record<string, unknown> {
    const out: Record<string, unknown> = {};

    // include event-level fields if visible (or if no filter provided)
    if (!propertyVisible || propertyVisible.has("start")) out.start = row.start;
    if (!propertyVisible || propertyVisible.has("end")) out.end = row.end;

    // include document properties
    for (const p of row.properties ?? []) {
      if (propertyVisible && !propertyVisible.has(p.name)) continue;
      out[p.name] = p.value; // keep raw ids/arrays/strings
    }
    return out;
  }

  //wiring delete
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    title?: string;
  } | null>(null);
  //toast + mutation
  const { toast } = useToast();
  const del = useDeleteTimelineEvent({
    projectId: projectId ?? "",
    docId: docId ?? "",
    collectionId: collectionId ?? "",
  });
  async function handleDelete(documentId: string, title?: string) {
    if (!projectId || !docId || !collectionId) return;
    try {
      await del.mutateAsync({ documentId });
      toast({ title: "Event deleted", description: title || documentId });
    } catch (e: any) {
      toast({
        title: "Failed to delete",
        description: e?.message ?? "Please try again",
        variant: "destructive",
      });
    } finally {
      setConfirmOpen(false);
      setPendingDelete(null);
    }
  }

  return (
    <div
      className="absolute inset-0 pointer-events-auto overflow-y-auto"
      style={{ overflowX: "hidden" }}
    >
      <div className="relative" style={{ height: contentHeight }}>
        {placed.map((p) => {
          const vv = visibleValues(p);
          console.log("[EventsLayer visibleValues]", {
            title: p.title,
            keys: Object.keys(vv),
            values: vv,
            visible: propertyVisible
              ? Array.from(propertyVisible)
              : "(no filter)",
          });

          return (
            <div
              key={p.id}
              className="absolute"
              style={{
                top: p.lane * laneHeight + LANE_GAP / 2,
                left: p.leftPx,
                width: p.widthPx,
                overflow: "visible",
              }}
            >
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <div>
                    <EventChip
                      title={p.title}
                      compact={p.isCompact}
                      onClick={() => onOpenDoc?.(p.documentId)}
                      values={vv}
                      visible={propertyVisible}
                      metaByName={metaByName}
                    />
                  </div>
                </ContextMenuTrigger>
                {/* ... */}
              </ContextMenu>
            </div>
          );
        })}

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this event?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The event{" "}
                <strong>{pendingDelete?.title || "Untitled"}</strong> will be
                permanently removed from your timeline.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (pendingDelete)
                    handleDelete(pendingDelete.id, pendingDelete.title);
                }}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
