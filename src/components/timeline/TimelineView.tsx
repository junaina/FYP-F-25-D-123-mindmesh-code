"use client";

import { buildScale, View, viewTitle } from "./grid/TimeScale";
import TickHeader from "./grid/TickHeader";
import GridBands from "./grid/GridBands";
import NowMarker from "./grid/NowMarker";
import TimelineNav from "./header/TimelineNav";
import ViewSwitcher from "./header/ViewSwitcher";
import { useTimelineEvents } from "@/modules/timeline/client/useTimelineEvents";
import EventsLayer from "./events/EventsLayer";
import {
  PropertyVisibilityMenu,
  type PropRow,
} from "@/components/calendar/PropertyVisibilityMenu";
import { PropKind } from "@/types/calendar";
import { mapServerEventToDto } from "./events/adapters";
import { useRef, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getTimelineProperties } from "@/modules/timeline/client/timeline.api";
import { TimelinePropertyDef } from "@/modules/timeline/dto/timeline.dto";
import type { PropertyOptionsMap } from "./events/adapters";
import { setTimelineVisibleProperties } from "@/modules/timeline/client/timeline.api";
import { NewEventButton } from "./events/NewEventButton";

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
  const [propVisible, setPropVisible] = useState<Set<string>>(new Set());
  // NEW: debounce + first-load guard
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedInitial = useRef(false);
  const [propertyDefs, setPropertyDefs] = useState<TimelinePropertyDef[]>([]);
  const [propertyOptions, setPropertyOptions] = useState<PropertyOptionsMap>(
    {}
  );
  // helper: map current visible NAMES -> IDS using loaded defs
  function currentVisibleIds(): string[] {
    const ids: string[] = [];
    for (const def of propertyDefs) {
      if (propVisible.has(def.name)) ids.push(def.id);
    }
    return ids;
  }
  useEffect(() => {
    if (!projectId || !docId || !collectionId) return;
    if (!hasLoadedInitial.current) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const propertyIds = currentVisibleIds();
        await setTimelineVisibleProperties(
          projectId,
          docId,
          collectionId,
          propertyIds
        );
        // (optional) toast success
      } catch (e) {
        // (optional) toast error
        console.error("Failed to persist property visibility", e);
      }
    }, 300);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // include deps that affect the computed ids
  }, [propVisible, propertyDefs, projectId, docId, collectionId]);
  const router = useRouter();
  function toggleProp(name: string, next: boolean) {
    setPropVisible((prev) => {
      const cp = new Set(prev);
      if (next) cp.add(name);
      else cp.delete(name);
      return cp;
    });
  }
  function openDoc(targetDocId: string) {
    if (!projectId || !targetDocId) {
      return;
    }
    router.push(`/projects/${projectId}/docs/${targetDocId}`);
  }
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

  const propRows = useMemo(() => {
    const seen = new Set<string>();
    const rows: PropRow[] = [];
    for (const d of propertyDefs) {
      if (seen.has(d.name)) continue;
      seen.add(d.name);
      rows.push({ name: d.name, kind: (d.kind ?? "text") as PropKind });
    }
    return rows;
  }, [propertyDefs]);

  useEffect(() => {
    if (!projectId || !docId || !collectionId) return;

    let cancelled = false;
    (async () => {
      const resp = await getTimelineProperties({
        projectId,
        docId,
        collectionId,
      });
      if (cancelled) return;
      setPropertyDefs(resp.properties);
      setPropertyOptions(resp.optionsByPropertyId ?? {});

      // convert visible ids -> visible *names* (because your events carry property names)
      const visibleNames = new Set(
        resp.visiblePropertyIds
          .map((id) => resp.properties.find((p) => p.id === id)?.name)
          .filter(Boolean) as string[]
      );
      setPropVisible(visibleNames);
      hasLoadedInitial.current = true;
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, docId, collectionId]);

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
  const title = viewTitle(view, start);
  const shouldCenter = view === "hour";
  const contentWidth = columns.length * columnWidth;

  const [qe, setQe] = useState<{
    rect: DOMRect | null;
    title: string;
    startISO: string;
    endISO: string;
  } | null>(null);

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
          {projectId && docId && collectionId && (
            <NewEventButton
              projectId={projectId}
              docId={docId}
              collectionId={collectionId}
              view={view}
              startISO={start}
            />
          )}
          <TimelineNav view={view} start={start} />
          <PropertyVisibilityMenu
            properties={propRows}
            visible={propVisible}
            onToggle={toggleProp}
            className="ml-2"
          />
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
            <div className="relative mt-1">
              <GridBands columns={columns} columnWidth={columnWidth}>
                <NowMarker startMs={startMs} endMs={endMs} nowMs={nowMs} />
                {!isLoading &&
                  !error &&
                  events.length > 0 &&
                  projectId &&
                  docId &&
                  collectionId && (
                    <EventsLayer
                      events={events}
                      startMs={startMs}
                      endMs={endMs}
                      contentWidth={contentWidth}
                      rowHeight={36}
                      maxVisibleRows={6}
                      propertyVisible={propVisible}
                      propertyDefs={propertyDefs}
                      propertyOptions={propertyOptions}
                      onOpenDoc={openDoc}
                      projectId={projectId}
                      docId={docId}
                      collectionId={collectionId}
                    />
                  )}
              </GridBands>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
