"use client";

import { buildScale, View, viewTitle } from "./grid/TimeScale";
import TickHeader from "./grid/TickHeader";
import GridBands from "./grid/GridBands";
import NowMarker from "./grid/NowMarker";
import TimelineNav from "./header/TimelineNav";
import ViewSwitcher from "./header/ViewSwitcher";
import { useTimelineEvents } from "@/modules/timeline/client/useTimelineEvents";
import EventsLayer from "./events/EventsLayer";
import { mapServerEventToDto } from "./events/adapters";
import { useRef, useState, useEffect } from "react";

export interface TimelineViewProps {
  projectId?: string;
  docId?: string;
  collectionId?: string;
  view: View;
  start: string; // ISO
  nowMs?: number; // pass from server
  className?: string;
}

export default function TimelineView({
  projectId,
  docId,
  collectionId,
  view,
  start,
  nowMs,
  className,
}: TimelineViewProps) {
  const { columns, startMs, endMs } = buildScale(view, start);

  //measuring container to stretch week view
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const { data, isLoading, error } = useTimelineEvents(
    projectId!,
    docId!,
    collectionId!,
    view,
    start
  );
  // API returns { events: [...] } per your route; adapt accordingly
  const events = Array.isArray((data as any)?.events)
    ? (data as any).events.map(mapServerEventToDto)
    : [];

  // open wiki doc (replace with your real navigation)
  function openDoc(documentId: string) {
    console.log("Open doc:", documentId);
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // each column will be COL_W px wide; this gives us real overflow
  const COL_W = 96; // tweak to taste or make it responsive later
  const stretchViews = view === "week" || view === "hour";
  const columnWidth =
    stretchViews && containerWidth > 0
      ? Math.floor(containerWidth / columns.length)
      : COL_W;
  const contentWidth = columns.length * columnWidth;
  const title = viewTitle(view, start);
  const shouldCenter = view === "hour";
  return (
    <div
      className={className}
      data-project-id={projectId}
      data-doc-id={docId}
      data-collection-id={collectionId}
    >
      {/* Header row: left switcher, center title, right nav */}
      <div className="mb-2 flex w-full items-center">
        <div className="flex-1">
          <ViewSwitcher view={view} start={start} />
        </div>

        <div className="flex-1 text-center">
          <div className="text-sm md:text-base font-medium text-secondary-foreground">
            {title}
          </div>
        </div>

        <div className="flex-1 flex justify-end">
          <TimelineNav view={view} start={start} />
        </div>
      </div>
      <div
        ref={containerRef}
        className="rounded-xl border bg-card shadow-sm overflow-x-auto"
      >
        <div
          className={shouldCenter ? "flex justify-center" : undefined}
          style={{ minWidth: "100%" }}
        >
          <div
            style={{
              width: contentWidth,
              minWidth: view === "week" ? "100%" : undefined,
            }}
          >
            <TickHeader
              columns={columns}
              view={view}
              columnWidth={columnWidth}
              showTodayDot={view === "month"}
            />

            <GridBands columns={columns} columnWidth={columnWidth}>
              <NowMarker startMs={startMs} endMs={endMs} nowMs={nowMs} />
              {!isLoading && !error && events.length > 0 && (
                <EventsLayer
                  events={events}
                  startMs={startMs}
                  endMs={endMs}
                  contentWidth={contentWidth}
                  rowHeight={36}
                  maxVisibleRows={6}
                  onOpenDoc={openDoc}
                />
              )}
            </GridBands>
          </div>
        </div>
      </div>
    </div>
  );
}
