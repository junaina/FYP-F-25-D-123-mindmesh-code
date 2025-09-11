"use client";

import React from "react";
import { CalendarItem, ID } from "@/types/calendar";
import EventCard from "@/components/calendar/EventCard";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  day: Date;
  isDim?: boolean;
  items: CalendarItem[];
  onAdd: () => void;
  onOpen: (item: CalendarItem) => void;
  onDropItem: (id: ID) => void;
};

export default function DayCell({
  day,
  isDim,
  items,
  onAdd,
  onOpen,
  onDropItem,
}: Props) {
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/calendar-id") as ID;
    if (id) onDropItem(id);
  };

  return (
    <div
      className={cn(
        "min-h-[120px] border-b border-r p-1.5 align-top",
        isDim && "bg-muted/30 text-muted-foreground"
      )}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onDoubleClick={onAdd}
      aria-label={`Day ${day.toDateString()}`}
      role="gridcell"
    >
      <div className="mb-1 flex items-center justify-between">
        <span className={cn("text-xs", isDim && "opacity-70")}>
          {day.getDate()}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onAdd}
          aria-label="Add item"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <EventCard key={item.id} item={item} onOpen={() => onOpen(item)} />
        ))}
      </div>
    </div>
  );
}
