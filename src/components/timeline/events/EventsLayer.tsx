"use client";
import EventChip from "./EventChip";

export type TimelineEventDto = {
  id: string;
  documentId: string;
  title: string;
  start: string; // ISO
  end: string; // ISO
  properties?: any[];
};
type Props = {
  events: TimelineEventDto[];
  startMs: number;
  endMs: number;
  contentWidth: number;
  rowHeight?: number;
  maxVisibleRows?: number;
  onOpenDoc?: (docId: string) => void;
};

export default function EventsLayer({
  events,
  startMs,
  endMs,
  contentWidth,
  rowHeight = 36,
  maxVisibleRows = 6,
  onOpenDoc,
}: Props) {
  const spanMs = Math.max(1, endMs - startMs);
  type Placed = TimelineEventDto & {
    lane: number;
    leftPx: number;
    widthPx: number;
  };
  const normalized = events
    .map((e) => ({
      ...e,
      _s: new Date(e.start).getTime(),
      _e: new Date(e.end).getTime(),
    }))
    .filter((e) => e._e > startMs && e._s < endMs)
    .sort((a, b) => a._s - b._s);
  // greedy interval packing -> lanesEnd[lane] holds the latest end time in that lane
  const lanesEnd: number[] = [];
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

    let lane = 0;
    while (lane < lanesEnd.length && lanesEnd[lane] > e._s) lane++;
    lanesEnd[lane] = Math.max(lanesEnd[lane] ?? 0, e._e);

    placed.push({ ...e, lane, leftPx, widthPx });
  }

  const lanes = lanesEnd.length;
  const visibleRows = Math.min(lanes, maxVisibleRows);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className="absolute inset-0 overflow-y-auto"
        style={{ height: visibleRows * rowHeight }}
      >
        <div className="relative" style={{ height: lanes * rowHeight }}>
          {placed.map((p) => (
            <div
              key={p.id}
              className="absolute"
              style={{
                top: p.lane * rowHeight + 4,
                left: p.leftPx,
                width: p.widthPx,
              }}
            >
              <EventChip
                title={p.title}
                onClick={() => onOpenDoc?.(p.documentId)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
