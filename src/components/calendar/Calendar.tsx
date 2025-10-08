"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PropertyVisibilityMenu } from "./PropertyVisibilityMenu";
import { Plus } from "lucide-react";
import { EditableText } from "@/components/kanban/EditableText";
import { AddItemDialog } from "./AddItemDialog";
import { useCalendarData } from "./useCalendarData";
import type { PropertyValueDto } from "@/modules/documents/dto/doc.dto";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { monthRangeUTC } from "@/components/calendar/useCalendarData";
import {
  createEvent as apiCreateEvent,
  moveEvent as apiMoveEvent,
  resizeEvent as apiResizeEvent,
} from "@/modules/calendar/client/calendar.api";
function useMeasuredHeight<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null);
  const [h, setH] = React.useState(0);

  React.useLayoutEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const obs = new ResizeObserver(() =>
      setH(el.getBoundingClientRect().height)
    );
    obs.observe(el);
    // initialize
    setH(el.getBoundingClientRect().height);
    return () => obs.disconnect();
  }, []);

  return { ref, height: h };
}

/* ================== UTC helpers ================== */
const ymdUTC = (d: Date) => d.toISOString().slice(0, 10);
const fmtMonthYear = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
function formatMonthYearUTC(d: Date) {
  return fmtMonthYear.format(d);
}

/* ================== Skeleton helpers ================== */

/** Stable 0..100 hash for a string; used for deterministic variants per day. */
function hash01(s: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff;
}

/** Decide a preset for a given day string so it’s stable across renders. */
function skeletonPresetForDay(dayKey: string) {
  const r = hash01(dayKey);
  // 0..1 → pick one of three richer templates
  if (r < 0.33) return { lines: 3, pills: 2 };
  if (r < 0.66) return { lines: 2, pills: 3 };
  return { lines: 1, pills: 1 };
}

/** A single shimmering line (title-like) with optional width % */
function SkelLine({ w = 100 }: { w?: number }) {
  return <div className="mm-skeleton h-4" style={{ width: `${w}%` }} />;
}

/** A small rounded “pill” chip skeleton (property/status look) */
function SkelPill({ w = 56 }: { w?: number }) {
  return (
    <div className="mm-skeleton h-5 rounded-full" style={{ width: `${w}px` }} />
  );
}

/** A richer cluster for one day: title + pills group, nice spacing */
function SkeletonDay({ dayKey }: { dayKey: string }) {
  const preset = skeletonPresetForDay(dayKey);

  // deterministically vary widths (no flicker) using more hash slices
  const h1 = Math.max(60, Math.round(80 + hash01(dayKey + "a") * 20)); // 80–100%
  const h2 = Math.max(40, Math.round(50 + hash01(dayKey + "b") * 30)); // 50–80%
  const h3 = Math.max(30, Math.round(40 + hash01(dayKey + "c") * 30)); // 40–70%

  const pillW = [
    56 + Math.round(hash01(dayKey + "p1") * 28), // 56–84px
    56 + Math.round(hash01(dayKey + "p2") * 28),
    56 + Math.round(hash01(dayKey + "p3") * 28),
  ];

  return (
    <div className="mt-1 space-y-1.5">
      {/* Title-ish lines */}
      {preset.lines >= 1 && <SkelLine w={h1} />}
      {preset.lines >= 2 && <SkelLine w={h2} />}
      {preset.lines >= 3 && <SkelLine w={h3} />}

      {/* Chip row */}
      {preset.pills > 0 && (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {Array.from({ length: preset.pills }).map((_, i) => (
            <SkelPill key={i} w={pillW[i]} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Render exactly what the calendar service returns (toPropertyValueDto). */
function displayPropValue(v: PropertyValueDto): string {
  switch (v.type) {
    case "text":
    case "email":
    case "url":
      return v.value ? String(v.value) : "";
    case "number":
      return v.value != null ? String(v.value) : "";
    case "checkbox":
      return v.value ? "✓" : "";
    case "date_time":
      return v.value ? String(v.value).slice(0, 10) : "";
    case "multi_select":
    case "file":
    case "person": {
      const arr = Array.isArray(v.value) ? v.value : [];
      return arr.join(", ");
    }
    case "select":
    case "status":
      // Day 1: optionId only; show raw id (labels later)
      return v.value ? String(v.value) : "";
    default:
      return "";
  }
}

/* Optional IDs for backend wiring */
type Props = {
  projectId?: string;
  docId?: string; // host doc (calendar page)
  collectionId?: string; // the calendar collection id
};
type PropsMap = Record<string, PropertyValueDto>;
// A segment is a slice of an event across a single week row
type WeekSegment = {
  key: string;
  title: string;
  docId: string;
  colStart: number; // 0..6 inside the week
  colEnd: number; // 0..6 inside the week (inclusive)
  lane: number; // 0..N, vertical stacking row in that week
  properties: Record<string, any>;
};

export function Calendar(props: Props) {
  const { projectId, docId, collectionId } = props;

  /* -------- Title (persist) -------- */
  const LS_TITLE = "mindmesh:calendar:title";
  const [calendarTitle, setCalendarTitle] = React.useState<string>(() => {
    if (typeof window === "undefined") return "MindMesh Calendar";
    return localStorage.getItem(LS_TITLE) || "MindMesh Calendar";
  });
  React.useEffect(() => {
    if (typeof window !== "undefined")
      localStorage.setItem(LS_TITLE, calendarTitle);
  }, [calendarTitle]);

  /* -------- View month (UTC) -------- */
  const [viewAnchor, setViewAnchor] = React.useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });
  const goPrev = () =>
    setViewAnchor(
      (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1))
    );
  const goNext = () =>
    setViewAnchor(
      (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))
    );
  const goToday = () => {
    const now = new Date();
    setViewAnchor(
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    );
  };

  /*----------------------- */
  const qc = useQueryClient();
  const { from, to } = monthRangeUTC(viewAnchor);
  const instancesKey = ["cal", collectionId, from, to];
  // Mutation to create a single-day event
  const { mutateAsync: createEvent, isPending: isCreating } = useMutation({
    mutationFn: async ({ title, date }: { title: string; date: Date }) => {
      return apiCreateEvent(projectId!, docId!, collectionId!, {
        mode: "single",
        date: ymdUTC(date),
        title: title.trim(),
      }); // returns { documentId }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: instancesKey });
    },
  });

  const moveMutation = useMutation({
    mutationFn: async (p: { documentId: string; deltaDays: number }) => {
      await apiMoveEvent(
        projectId!,
        docId!,
        collectionId!,
        p.documentId,
        Math.trunc(p.deltaDays)
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: instancesKey });
    },
  });
  const resizeMutation = useMutation({
    mutationFn: async (p: {
      documentId: string;
      edge: "start" | "end";
      toYmd: string;
    }) => {
      await apiResizeEvent(
        projectId!,
        docId!,
        collectionId!,
        p.documentId,
        p.edge,
        p.toYmd
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: instancesKey });
    },
  });

  /* -------- Add dialog placeholder (no local create) -------- */
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);

  async function handleAddSubmit({ title }: { title: string }) {
    if (!selectedDate) return;
    setDialogOpen(true);
    await createEvent({ title, date: selectedDate });
    // Dialog auto-closes in AddItemDialog, but we keep state clean anyway
    setDialogOpen(false);
    setSelectedDate(null);
  }
  /* -------- 42-day grid (UTC) -------- */
  const firstOfMonth = viewAnchor;
  const firstWeekday = firstOfMonth.getUTCDay(); // Sunday=0
  const gridStart = new Date(firstOfMonth);
  gridStart.setUTCDate(firstOfMonth.getUTCDate() - firstWeekday);
  const gridStartTime = gridStart.getTime();
  const days: Date[] = React.useMemo(
    () =>
      Array.from(
        { length: 42 },
        (_, i) => new Date(gridStartTime + i * 86400000)
      ),
    [gridStartTime]
  );
  const todayYMD = ymdUTC(new Date());
  const weeks = React.useMemo(() => {
    const out: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) out.push(days.slice(i, i + 7));
    return out;
  }, [days]);

  /* -------- Read path: fetch server data for the month -------- */
  const { instances, properties, settings, showSkeleton, isFetchingAny } =
    useCalendarData(projectId!, docId!, collectionId!, viewAnchor);

  // Map backend propertyId → human name (for badges & visibility menu)
  const propIdToName = React.useMemo(() => {
    const map = new Map<string, string>();
    const rows = properties.data?.properties ?? [];
    for (const p of rows) map.set(p.id, p.name);
    return map;
  }, [properties.data]);

  // Build the property menu index from backend properties (name/kind)
  const propertyIndex = React.useMemo(() => {
    const rows = properties.data?.properties ?? [];
    return rows
      .map((p) => ({
        name: p.name,
        // normalize to your UI's PropKind expectations (fallback to "text")
        kind: (p.kind as any) ?? "text",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [properties.data]);

  // Visibility set is kept by name (menu works with names)
  const LS_VISIBLE = "mindmesh:calendar:visibleProps:v2";
  const [visibleProps, setVisibleProps] = React.useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set<string>();
    try {
      const raw = localStorage.getItem(LS_VISIBLE);
      return new Set(raw ? (JSON.parse(raw) as string[]) : []); // start empty; user picks
    } catch {
      return new Set<string>();
    }
  });
  React.useEffect(() => {
    if (typeof window !== "undefined")
      localStorage.setItem(
        LS_VISIBLE,
        JSON.stringify(Array.from(visibleProps))
      );
  }, [visibleProps]);

  // Build flat rows for range layout
  const rangeRows = React.useMemo(() => {
    const rows: Array<{
      id: string;
      title: string;
      start: Date;
      end: Date;
      docId: string;
      properties: Record<string, any>;
    }> = [];

    const list = instances.data?.instances ?? [];
    for (const it of list) {
      const start = new Date(it.start);
      const end = new Date(it.end);
      //skipping inverted ranges
      if (end < start) {
        continue;
      }
      rows.push({
        id: it.instanceId,
        title: it.title,
        start,
        end,
        docId: it.documentId,
        properties: it.properties as Record<string, any>,
      });
    }
    return rows;
  }, [instances.data]);

  // --- date helpers (UTC) ---
  const MS_DAY = 86400000;
  const atUTCMidnight = (d: Date) =>
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const diffDaysUTC = (a: Date, b: Date) =>
    Math.floor(
      (atUTCMidnight(a).getTime() - atUTCMidnight(b).getTime()) / MS_DAY
    );
  const clamp = (n: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, n));

  // Assign lanes so overlapping segments in a week don’t collide
  function layoutWeekSegments(
    rows: Array<{
      id: string;
      title: string;
      start: Date;
      end: Date;
      docId: string;
      properties: Record<string, any>;
    }>,
    weekStart: Date
  ): WeekSegment[] {
    const weekStartMid = atUTCMidnight(weekStart);
    const weekEndMid = new Date(weekStartMid.getTime() + 6 * MS_DAY);

    // 1) slice events to this week
    const segs = rows
      .map((r) => {
        const s = atUTCMidnight(r.start);
        const e = atUTCMidnight(r.end);
        if (e < weekStartMid || s > weekEndMid) return null;

        const colStart = clamp(
          diffDaysUTC(s < weekStartMid ? weekStartMid : s, weekStartMid),
          0,
          6
        );
        const colEnd = clamp(
          diffDaysUTC(e > weekEndMid ? weekEndMid : e, weekStartMid),
          0,
          6
        );

        return {
          key: `${r.id}:${weekStartMid.toISOString()}`,
          title: r.title,
          docId: r.docId,
          colStart,
          colEnd,
          lane: 0,
          properties: r.properties,
        } as WeekSegment;
      })
      .filter(Boolean) as WeekSegment[];

    // 2) greedy lane assignment by start col
    segs.sort((a, b) => a.colStart - b.colStart || b.colEnd - a.colEnd);
    const laneEnds: number[] = []; // last occupied col per lane
    for (const s of segs) {
      let placed = false;
      for (let i = 0; i < laneEnds.length; i++) {
        if (s.colStart > laneEnds[i]) {
          s.lane = i;
          laneEnds[i] = s.colEnd;
          placed = true;
          break;
        }
      }
      if (!placed) {
        s.lane = laneEnds.length;
        laneEnds.push(s.colEnd);
      }
    }
    return segs;
  }

  /* ================== RENDER ================== */
  return (
    <div className="space-y-4">
      {/* ======= Title row ======= */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <EditableText
            value={calendarTitle}
            onChange={(v) => setCalendarTitle(v.trim() || "MindMesh Calendar")}
            placeholder="Untitled Calendar"
            className="text-xl sm:text-2xl md:text-3xl font-bold px-1 py-1 truncate"
          />
          <div className="mt-1 text-muted-foreground text-sm sm:text-base">
            {formatMonthYearUTC(viewAnchor)}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <PropertyVisibilityMenu
            properties={propertyIndex}
            visible={visibleProps}
            onToggle={(name, next) =>
              setVisibleProps((prev) => {
                const s = new Set(prev);
                if (next) s.add(name);
                else s.delete(name);
                return s;
              })
            }
            onOpenDetails={(name) =>
              console.debug("open property details:", name)
            }
            onNewProperty={() => console.debug("new property")}
          />

          <Button
            variant="outline"
            size="icon"
            aria-label="Previous month"
            onClick={goPrev}
          >
            ‹
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next month"
            onClick={goNext}
          >
            ›
          </Button>
          <Button onClick={goToday} className="text-xs sm:text-sm">
            Today
          </Button>
        </div>
      </div>

      {/* Weekday headers (unique keys) */}
      <div className="grid grid-cols-7 text-[10px] sm:text-xs text-muted-foreground">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={`${d}-${i}`} className="px-1 sm:px-2 py-1 text-center">
            {d}
          </div>
        ))}
      </div>
      {/* 42-DAY GRID — weekly wrappers so we can span chips across days */}
      <div className="rounded-lg border overflow-hidden bg-background">
        {weeks.map((week, wIdx) => {
          const weekStart = week[0];
          const segs = !showSkeleton
            ? layoutWeekSegments(rangeRows, weekStart)
            : [];

          // measure the natural height of the chips band
          const { ref: lanesRef, height: laneSpace } =
            useMeasuredHeight<HTMLDivElement>();

          return (
            <div
              key={wIdx}
              className="relative border-t border-border first:border-t-0"
              // expose a CSS var so children stay in sync
              style={{ ["--lane-space" as any]: `${laneSpace}px` }}
            >
              {/* === CHIP LANES (auto-height) — rendered INSIDE the week === */}
              {!showSkeleton && (
                <div
                  ref={lanesRef}
                  className={cn(
                    "pointer-events-none absolute inset-x-0 top-0 z-10", // sit inside the week
                    "grid grid-cols-7 gap-px bg-transparent px-1 py-1"
                  )}
                  aria-hidden
                >
                  {segs.map((s) => {
                    const spanCols = s.colEnd - s.colStart + 1;
                    return (
                      <a
                        key={s.key}
                        href={`/projects/${projectId}/docs/${s.docId}`}
                        className={cn(
                          "pointer-events-auto self-start mx-0.5 my-0.5 rounded-md px-2 py-1.5",
                          "bg-border text-foreground/90 border border-white/10 shadow-sm",
                          "overflow-hidden"
                        )}
                        style={{
                          gridColumn: `${s.colStart + 1} / span ${spanCols}`,
                          gridRow: s.lane + 1,
                        }}
                        title={s.title}
                        draggable
                        onDragStart={(e) => {
                          const startISO = new Date(
                            Date.UTC(
                              weekStart.getUTCFullYear(),
                              weekStart.getUTCMonth(),
                              weekStart.getUTCDate() + s.colStart
                            )
                          ).toISOString();
                          e.dataTransfer.setData(
                            "text/plain",
                            JSON.stringify({
                              documentId: s.docId,
                              start: startISO,
                            })
                          );
                        }}
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium leading-5">
                            {s.title}
                          </div>
                          {/* pills wrap; lane grows naturally */}
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {Object.entries(s.properties).map(
                              ([propId, val]) => {
                                const name = propIdToName.get(propId);
                                if (!name || !visibleProps.has(name))
                                  return null;
                                const txt = displayPropValue(
                                  val as PropertyValueDto
                                ).trim();
                                if (!txt) return null;
                                return (
                                  <span
                                    key={propId}
                                    title={name}
                                    className="rounded-full px-2 py-[2px] text-[10px] leading-[12px] whitespace-nowrap bg-muted/60 border border-white/10"
                                  >
                                    {txt}
                                  </span>
                                );
                              }
                            )}
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}

              {/* === DAY GRID — padded top by the measured lane height === */}
              <div
                className="grid grid-cols-7 gap-px bg-border"
                style={{ paddingTop: "var(--lane-space)" }} // room for chips inside the cells
              >
                {week.map((date) => {
                  const key = ymdUTC(date);
                  const isOtherMonth =
                    date.getUTCMonth() !== viewAnchor.getUTCMonth();
                  const isToday = key === todayYMD;

                  return (
                    <DayCell
                      key={key}
                      id={key}
                      date={date}
                      isOtherMonth={isOtherMonth}
                      isToday={isToday}
                      loading={showSkeleton}
                      onClickAdd={() => {
                        setSelectedDate(date);
                        setDialogOpen(true);
                      }}
                      onMoveDrop={(payload) => {
                        const target = date; // this cell’s date
                        const start = new Date(payload.start); // chip’s original start

                        const atUTCMidnight = (d: Date) =>
                          new Date(
                            Date.UTC(
                              d.getUTCFullYear(),
                              d.getUTCMonth(),
                              d.getUTCDate()
                            )
                          );
                        const MS_DAY = 86400000;
                        const deltaDays = Math.floor(
                          (atUTCMidnight(target).getTime() -
                            atUTCMidnight(start).getTime()) /
                            MS_DAY
                        );

                        if (deltaDays !== 0) {
                          moveMutation.mutate({
                            documentId: payload.documentId,
                            deltaDays,
                          });
                        }
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add dialog – currently no local create; wire to POST later */}
      {/* Keep UI, but do not insert local items anymore */}
      <AddItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        date={selectedDate ?? null}
        onAdd={handleAddSubmit}
      />
    </div>
  );
}

/* ================== subcomponents ================== */

function DayCell({
  id,
  date,
  isOtherMonth,
  isToday,
  onClickAdd,
  onMoveDrop,
  children,
  loading,
  extraTop = 0,
}: {
  id: string;
  date: Date;
  isOtherMonth: boolean;
  isToday: boolean;
  onClickAdd: () => void;
  onMoveDrop?: (p: { documentId: string; start: string }) => void;
  children?: React.ReactNode;
  loading?: boolean;
  extraTop?: number; // px to add to top padding for lane space
}) {
  return (
    <div
      className={cn(
        "relative group min-h-[80px] sm:min-h-[120px] p-0.5 sm:p-1 flex flex-col transition-colors select-none cursor-default",
        isOtherMonth
          ? "bg-muted/40 text-muted-foreground/70 hover:bg-muted/50"
          : "bg-background hover:bg-muted/40"
      )}
      style={{ paddingTop: `calc(0.25rem + ${extraTop}px)` }} // ← reserve room for lanes
      onClick={(e) => {
        if (e.currentTarget === e.target) onClickAdd();
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        try {
          const raw = e.dataTransfer.getData("text/plain");
          if (!raw) return;
          const payload = JSON.parse(raw) as {
            documentId: string;
            start: string;
          };
          onMoveDrop?.(payload);
        } catch {}
      }}
    >
      <div className="relative z-20 flex items-center justify-between">
        <span
          className={cn(
            "text-xs",
            isOtherMonth ? "text-muted-foreground/70" : "text-muted-foreground"
          )}
        >
          {date.getUTCDate()}
        </span>

        {isToday && (
          <span className="mm-today text-[10px] leading-none px-1.5 py-0.5 bg-pink-500/15 text-pink-400 border border-pink-400/30">
            Today
          </span>
        )}
      </div>

      {/* Add button – top-right; visible on hover (always visible on touch) */}
      <button
        type="button"
        aria-label="Add item"
        onClick={(e) => {
          e.stopPropagation();
          onClickAdd();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className={cn(
          "absolute top-1 right-1 z-20 rounded p-1 text-muted-foreground",
          "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity"
        )}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>

      <div className="flex flex-col gap-1 mt-1">
        {loading ? <SkeletonDay dayKey={id} /> : children ?? null}
      </div>
    </div>
  );
}
