"use client";

import * as React from "react";
import { seedItems } from "@/data/calendarData";
import type { CalendarItem } from "@/types/calendar";
import { AddItemDialog } from "./AddItemDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PropertyVisibilityMenu } from "./PropertyVisibilityMenu";
import { ItemProperties } from "@/components/ui/ItemProperties";
import { Plus } from "lucide-react";
import type { PropKind } from "@/types/calendar";
// Editable inline title from your Kanban folder
import { EditableText } from "@/components/kanban/EditableText";

// dnd-kit (mouse + touch + keyboard)
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";

function formatMonthYear(d: Date) {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function Calendar() {
  // ---- title with localStorage persistence
  const LS_TITLE = "mindmesh:calendar:title";
  const [calendarTitle, setCalendarTitle] = React.useState<string>(() => {
    if (typeof window === "undefined") return "MindMesh Calendar";
    return localStorage.getItem(LS_TITLE) || "MindMesh Calendar";
  });
  React.useEffect(() => {
    if (typeof window !== "undefined")
      localStorage.setItem(LS_TITLE, calendarTitle);
  }, [calendarTitle]);

  // items
  const LS_ITEMS = "mindmesh:calendar:items:v2";

  const [items, setItems] = React.useState<CalendarItem[]>(() => {
    if (typeof window === "undefined") return seedItems;
    try {
      const raw = window.localStorage.getItem(LS_ITEMS);
      if (!raw) return seedItems;
      const parsed = JSON.parse(raw) as CalendarItem[];
      // if cached items have no properties, treat as stale and use new seed
      const hasAnyProps = parsed.some(
        (it) => it.properties && Object.keys(it.properties).length > 0
      );
      return hasAnyProps ? parsed : seedItems;
    } catch {
      return seedItems;
    }
  });
  const handleToggleCheckbox = React.useCallback(
    (itemId: string, propName: string, next: boolean) => {
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== itemId) return it;
          if (!it.properties) return it;

          const prop = it.properties[propName];
          if (!prop || prop.value.kind !== "checkbox") return it;

          return {
            ...it,
            properties: {
              ...it.properties,
              [propName]: { ...prop, value: { kind: "checkbox", value: next } },
            },
          };
        })
      );
    },
    [setItems]
  );
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LS_ITEMS, JSON.stringify(items));
    }
  }, [items]);

  // (optional) clean up the OLD key once so it can't override again
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("mindmesh:calendar:items");
    }
  }, []);

  // properties visibility (persisted)
  const LS_VISIBLE = "mindmesh:calendar:visibleProps:v2";

  const [visibleProps, setVisibleProps] = React.useState<Set<string>>(() => {
    if (typeof window === "undefined")
      return new Set(["Status", "Assignee", "Tags", "When"]);
    try {
      const raw = localStorage.getItem(LS_VISIBLE);
      return new Set(
        raw
          ? (JSON.parse(raw) as string[])
          : ["Status", "Assignee", "Tags", "When"]
      );
    } catch {
      return new Set(["Status", "Assignee", "Tags", "When"]);
    }
  });

  React.useEffect(() => {
    if (typeof window !== "undefined")
      localStorage.setItem(
        LS_VISIBLE,
        JSON.stringify(Array.from(visibleProps))
      );
  }, [visibleProps]);

  // view state
  const [viewAnchor, setViewAnchor] = React.useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);

  // derived 42-day grid
  const firstOfMonth = viewAnchor;
  const firstWeekday = firstOfMonth.getDay();
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - firstWeekday);
  const gridStartTime = gridStart.getTime();

  const days: Date[] = React.useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => {
        const d = new Date(gridStartTime);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [gridStartTime]
  );
  const propertyIndex = React.useMemo(() => {
    const map = new Map<string, PropKind>();
    for (const it of items) {
      if (!it.properties) continue;
      for (const p of Object.values(it.properties)) {
        if (!map.has(p.name)) map.set(p.name, p.value.kind);
      }
    }
    return Array.from(map, ([name, kind]) => ({ name, kind })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [items]);

  // navigation
  const goPrev = () =>
    setViewAnchor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNext = () =>
    setViewAnchor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const goToday = () => {
    const now = new Date();
    setViewAnchor(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  // add item
  const handleAdd = ({ title }: { title: string }) => {
    if (!selectedDate) return;
    const newItem: CalendarItem = {
      id: crypto.randomUUID(),
      date: ymd(selectedDate),
      title,
      createdAt: new Date().toISOString(),
      properties: {}, // could seed defaults if you want
    };
    setItems((prev) => [...prev, newItem]);
  };

  const todayYMD = ymd(new Date());

  // dnd-kit
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      pressDelay: 120,
      activationConstraint: { delay: 120, tolerance: 5 },
    }),
    useSensor(KeyboardSensor)
  );
  function handleDragEnd(e: DragEndEvent) {
    const id = e.active.id as string;
    const overId = e.over?.id as string | undefined;
    if (!overId) return;
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, date: overId } : it))
    );
  }

  return (
    <div className="space-y-4">
      {/* ======= Title row (responsive) ======= */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <EditableText
            value={calendarTitle}
            onChange={(v) => setCalendarTitle(v.trim() || "MindMesh Calendar")}
            placeholder="Untitled Calendar"
            className="text-xl sm:text-2xl md:text-3xl font-bold px-1 py-1 truncate"
          />
          <div className="mt-1 text-muted-foreground text-sm sm:text-base">
            {formatMonthYear(viewAnchor)}
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
            onOpenDetails={(name) => {
              // we'll hook a dialog here later
              // for now, just log or no-op
              console.debug("open property details:", name);
            }}
            onNewProperty={() => {
              console.debug("new property clicked");
            }}
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

      {/* Weekday headers (responsive) */}
      <div className="grid grid-cols-7 text-[10px] sm:text-xs text-muted-foreground">
        {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
          <div key={d} className="px-1 sm:px-2 py-1 text-center">
            {d}
          </div>
        ))}
      </div>

      {/* 42-DAY GRID with DnD */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-7 gap-px bg-border border rounded-lg overflow-hidden">
          {days.map((date) => {
            const key = ymd(date);
            const dayItems = items.filter((i) => i.date === key);
            const isOtherMonth = date.getMonth() !== viewAnchor.getMonth();
            const isToday = key === todayYMD;

            return (
              <DayCell
                key={key}
                date={date}
                dateKey={key}
                isOtherMonth={isOtherMonth}
                isToday={isToday}
                onAdd={() => {
                  setSelectedDate(date);
                  setDialogOpen(true);
                }}
              >
                {dayItems.map((item) => (
                  <Chip
                    key={item.id}
                    item={item}
                    visibleProps={visibleProps}
                    onToggleCheckbox={(propName, next) =>
                      handleToggleCheckbox(item.id, propName, next)
                    }
                  />
                ))}
              </DayCell>
            );
          })}
        </div>
      </DndContext>

      <AddItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        date={selectedDate}
        onAdd={handleAdd}
      />
    </div>
  );
}

function Chip({
  item,
  visibleProps,
  onToggleCheckbox,
}: {
  item: CalendarItem;
  visibleProps: Set<string>;
  onToggleCheckbox: (propName: string, next: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: item.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(
        "rounded px-1 py-0.5 outline-none bg-primary/10 text-primary",
        "text-[11px] leading-5 space-y-0.5 pb-1",
        isDragging && "opacity-60"
      )}
      role="button"
      aria-grabbed={isDragging}
    >
      <div className="truncate">{item.title}</div>
      <ItemProperties
        properties={item.properties}
        visible={visibleProps}
        onToggleCheckbox={onToggleCheckbox}
      />
    </div>
  );
}

function DayCell({
  date,
  dateKey,
  isOtherMonth,
  isToday,
  onAdd,
  children,
}: {
  date: Date;
  dateKey: string;
  isOtherMonth: boolean;
  isToday: boolean;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dateKey });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative group min-h-[80px] sm:min-h-[120px] p-0.5 sm:p-1 flex flex-col transition-colors select-none",
        "bg-background",
        isOtherMonth && "bg-muted/50",
        "hover:bg-muted/40 cursor-default",
        isOver && "ring-2 ring-accent/40"
      )}
      // open dialog ONLY when clicking empty background
      onClick={(e) => {
        if (e.currentTarget === e.target) onAdd();
      }}
      aria-dropeffect="move"
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-xs",
            isOtherMonth ? "text-muted-foreground/70" : "text-muted-foreground"
          )}
        >
          {date.getDate()}
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
          onAdd();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className={cn(
          "absolute top-1 right-1 rounded p-1 text-muted-foreground",
          "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          // desktop: fade in on hover; mobile: keep visible
          "sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity"
        )}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>

      <div className="flex flex-col gap-1 mt-1">{children}</div>
    </div>
  );
}
