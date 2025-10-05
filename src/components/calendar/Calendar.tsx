"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PropertyVisibilityMenu } from "./PropertyVisibilityMenu";
import { Plus } from "lucide-react";
import { EditableText } from "@/components/kanban/EditableText";

import { useCalendarData } from "./useCalendarData";
import type { CalendarInstance } from "@/modules/calendar/dto/calendar.dto";
import type { PropertyValueDto } from "@/modules/documents/dto/doc.dto";

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

  /* -------- Add dialog placeholder (no local create) -------- */
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);

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

  // Group remote instances by day (UTC), expanding ranges
  const remoteByDay: Record<string, CalendarInstance[]> = React.useMemo(() => {
    const out: Record<string, CalendarInstance[]> = {};
    const rows = instances.data?.instances ?? [];
    for (const it of rows) {
      const s = new Date(it.start);
      const e = new Date(it.end);
      const start = new Date(
        Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate())
      );
      const end = new Date(
        Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate())
      );
      for (
        let d = new Date(start);
        d <= end;
        d.setUTCDate(d.getUTCDate() + 1)
      ) {
        const key = ymdUTC(d);
        (out[key] ||= []).push(it);
      }
    }
    return out;
  }, [instances.data]);
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
      rows.push({
        id: it.instanceId,
        title: it.title,
        start: new Date(it.start),
        end: new Date(it.end),
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

      {/* 42-DAY GRID */}
      <div className="grid grid-cols-7 gap-px bg-border border rounded-lg overflow-hidden">
        {days.map((date) => {
          const key = ymdUTC(date);
          const isOtherMonth = date.getUTCMonth() !== viewAnchor.getUTCMonth();
          const isToday = key === todayYMD;

          // Remote events for this day
          const remoteEvents = remoteByDay[key] ?? [];

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
            >
              {/* Render only remote events (from backend) */}
              {remoteEvents.map((ev) => (
                <RemoteChip
                  key={ev.instanceId}
                  title={ev.title}
                  href={`/docs/${ev.documentId}`}
                >
                  <div className="flex flex-wrap gap-1">
                    {(
                      Object.entries(
                        ev.properties as Record<string, PropertyValueDto>
                      ) as [string, PropertyValueDto][]
                    ).map(([pid, v]) => {
                      const name = propIdToName.get(pid);
                      if (!name || !visibleProps.has(name)) return null;
                      return (
                        <span key={pid} className="mm-chip mm-chip--gray">
                          {displayPropValue(v)}
                        </span>
                      );
                    })}
                  </div>
                </RemoteChip>
              ))}
            </DayCell>
          );
        })}
      </div>

      {/* Add dialog – currently no local create; wire to POST later */}
      {/* Keep UI, but do not insert local items anymore */}
      {/* <AddItemDialog ... onAdd={() => { call backend then invalidate queries }} /> */}
    </div>
  );
}

/* ================== subcomponents ================== */

function RemoteChip({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={cn(
        "block w-full truncate rounded-md bg-muted/60 px-2 py-1 text-left text-xs sm:text-sm hover:bg-muted/70"
      )}
      title={title}
    >
      <div className="font-medium truncate">{title}</div>
      {children}
    </a>
  );
}

function DayCell({
  id,
  date,
  isOtherMonth,
  isToday,
  onClickAdd,
  children,
  loading,
}: {
  id: string;
  date: Date;
  isOtherMonth: boolean;
  isToday: boolean;
  onClickAdd: () => void;
  children: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative group min-h-[80px] sm:min-h-[120px] p-0.5 sm:p-1 flex flex-col transition-colors select-none",
        "bg-background",
        isOtherMonth && "bg-muted/50",
        "hover:bg-muted/40 cursor-default"
      )}
      onClick={(e) => {
        if (e.currentTarget === e.target) onClickAdd();
      }}
    >
      <div className="flex items-center justify-between">
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
          "absolute top-1 right-1 rounded p-1 text-muted-foreground",
          "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity"
        )}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>

      <div className="flex flex-col gap-1 mt-1">
        {loading ? <SkeletonDay dayKey={id} /> : children}
      </div>
    </div>
  );
}
