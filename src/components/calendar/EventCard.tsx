"use client";

import React from "react";
import { CalendarItem } from "@/types/calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = {
  item: CalendarItem;
  onOpen: () => void;
};

export default function EventCard({ item, onOpen }: Props) {
  // Start drag with the calendar item id so DayCell can read it
  const onDragStart = (e: React.DragEvent<HTMLButtonElement>) => {
    e.dataTransfer.setData("text/calendar-id", item.id);
    e.dataTransfer.effectAllowed = "move";
  };

  // Pull a couple tiny previews (status only for now)
  const statusLabel = (() => {
    const v = item.properties["status"];
    if (v && v.kind === "status" && v.optionId) {
      // Capitalize for display (e.g., "doing" -> "Doing")
      return v.optionId.slice(0, 1).toUpperCase() + v.optionId.slice(1);
    }
    return null;
  })();

  return (
    <button
      onClick={onOpen}
      draggable
      onDragStart={onDragStart}
      className={cn(
        "group w-full rounded-md border bg-background px-2 py-1 text-left text-xs",
        "shadow-sm transition hover:border-primary/40 hover:bg-accent/50"
      )}
      aria-label={`Open "${item.title || "Untitled"}"`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="line-clamp-1 font-medium">
          {item.title || "Untitled"}
        </span>
      </div>

      {statusLabel && (
        <div className="mt-1">
          <Badge variant="outline" className="px-1 py-0 text-[10px]">
            {statusLabel}
          </Badge>
        </div>
      )}
    </button>
  );
}
