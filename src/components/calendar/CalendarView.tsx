"use client";

import React from "react";
import { seedCalendar } from "@/data/calendarSample";
import {
  CalendarItem,
  CalendarData,
  ID,
  PropertyValue,
} from "@/types/calendar";
import {
  addMonths,
  formatMonthTitle,
  getMonthMatrix,
  startOfDay,
  toISO,
} from "@/lib/calendar-date";

import DayCell from "@/components/calendar/DayCell";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

// --- Local storage for frontend-only persistence ---
const LS_KEY = "mvp.calendar.items";

function loadItems(): CalendarItem[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as CalendarItem[]) : null;
  } catch {
    return null;
  }
}

function saveItems(items: CalendarItem[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {
    // no-op
  }
}

export default function CalendarView() {
  // Seed data once and reuse (avoids calling seedCalendar multiple times)
  const initialData = React.useMemo<CalendarData>(() => seedCalendar(), []);
  const [data] = React.useState<CalendarData>(initialData);

  const [monthAnchor, setMonthAnchor] = React.useState<Date>(() =>
    startOfDay(new Date())
  );
  const [items, setItems] = React.useState<CalendarItem[]>(
    () => loadItems() ?? initialData.items
  );
  const [query, setQuery] = React.useState("");

  React.useEffect(() => saveItems(items), [items]);

  // Month grid (42 days like Notion)
  const days = React.useMemo(() => getMonthMatrix(monthAnchor), [monthAnchor]);
  const inThisMonth = (d: Date) => d.getMonth() === monthAnchor.getMonth();

  // Search filter
  const filteredItems = React.useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((i) => i.title.toLowerCase().includes(q));
  }, [items, query]);

  // Group items by day
  const itemsByDay = React.useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const it of filteredItems) {
      const key = startOfDay(new Date(it.date)).toISOString();
      const arr = map.get(key) ?? [];
      arr.push(it);
      map.set(key, arr);
    }
    return map;
  }, [filteredItems]);

  // Create a new empty item on a given day (no dialog)
  const createOn = (day: Date) => {
    const props: Record<ID, PropertyValue> = {};
    for (const s of data.propertySchemas) {
      switch (s.kind) {
        case "text":
          props[s.id] = { kind: "text", value: "" };
          break;
        case "number":
          props[s.id] = { kind: "number", value: null };
          break;
        case "select":
          props[s.id] = {
            kind: "select",
            optionId: s.options?.[0]?.id ?? null,
          };
          break;
        case "multi_select":
          props[s.id] = { kind: "multi_select", optionIds: [] };
          break;
        case "status":
          props[s.id] = {
            kind: "status",
            optionId: s.options?.[0]?.id ?? null,
          };
          break;
        case "date":
          props[s.id] = { kind: "date", value: toISO(day) };
          break;
        case "person":
          props[s.id] = { kind: "person", userIds: [] };
          break;
        case "checkbox":
          props[s.id] = { kind: "checkbox", value: false };
          break;
        case "url":
          props[s.id] = { kind: "url", value: null };
          break;
      }
    }

    const empty: CalendarItem = {
      id: Math.random().toString(36).slice(2, 10) as ID,
      title: "Untitled",
      date: toISO(day),
      description: "",
      properties: props,
    };

    setItems((prev) => [empty, ...prev]);
  };

  const moveItem = (id: ID, toDay: Date) =>
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, date: toISO(toDay) } : x))
    );

  // Clicking an item: log it (you can replace with your own wiki route)
  const handleOpen = (item: CalendarItem) => {
    // TODO: navigate to your wiki page for this item
    // e.g., router.push(`/wiki/${item.id}`)

    console.log("[Calendar] item clicked:", item);
  };

  return (
    <div className="mx-auto max-w-[1200px] p-6">
      {/* Title */}
      <div className="mb-2 flex items-center gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{data.title}</h1>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Here is where examples and screenshots of work are collected regularly.
        Create new entry on project day.
      </p>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="rounded-lg">
            Calendar ▾
          </Button>
          <Separator orientation="vertical" className="mx-2 h-6" />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMonthAnchor((d) => addMonths(d, -1))}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMonthAnchor((d) => addMonths(d, 1))}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setMonthAnchor(startOfDay(new Date()))}
            >
              Today
            </Button>
          </div>
          <span className="ml-2 text-sm text-muted-foreground">
            {formatMonthTitle(monthAnchor)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-56 pl-8"
            />
          </div>
          <Button onClick={() => createOn(startOfDay(new Date()))}>
            <Plus className="mr-2 h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <Card className="overflow-hidden border-border/60">
        <div className="grid grid-cols-7 bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          {"Sun,Mon,Tue,Wed,Thu,Fri,Sat".split(",").map((d) => (
            <div key={d} className="px-3 py-2">
              {d}
            </div>
          ))}
        </div>

        <ScrollArea className="h-[70vh]">
          <div className="grid grid-cols-7 border-t">
            {days.map((day, i) => (
              <DayCell
                key={i}
                day={day}
                isDim={!inThisMonth(day)}
                items={itemsByDay.get(startOfDay(day).toISOString()) ?? []}
                onAdd={() => createOn(day)}
                onOpen={handleOpen}
                onDropItem={(id) => moveItem(id, day)}
              />
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
