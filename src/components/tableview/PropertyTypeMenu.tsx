"use client";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckSquare,
  Calendar,
  Hash,
  Italic,
  Link,
  ListChecks,
  User,
  Tag,
  ToggleLeft,
} from "lucide-react";
import type { PropertyType } from "@/modules/table-view/client/table.api";

const GROUPS: { label: string; items: { icon: React.ReactNode; label: string; type: PropertyType }[] }[] = [
  {
    label: "Basic",
    items: [
      { icon: <Italic />, label: "Text", type: "text" },
      { icon: <Hash />, label: "Number", type: "number" },
      { icon: <ToggleLeft />, label: "Checkbox", type: "checkbox" },
      { icon: <Link />, label: "URL", type: "url" },
      { icon: <User />, label: "Person", type: "person" },
    ],
  },
  {
    label: "Options",
    items: [
      { icon: <Tag />, label: "Select", type: "select" },
      { icon: <ListChecks />, label: "Multi-select", type: "multi_select" },
      { icon: <CheckSquare />, label: "Status", type: "status" },
    ],
  },
  {
    label: "Other",
    items: [{ icon: <Calendar />, label: "Date", type: "date_time" }],
  },
];

export function PropertyTypeMenu({
  onSelect,
}: {
  onSelect: (x: { label: string; type: PropertyType }) => void;
}) {
  return (
    <div className="w-64">
      <DropdownMenuLabel className="text-xs text-muted-foreground">Add property</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <ScrollArea className="max-h-80">
        {GROUPS.map((g) => (
          <div key={g.label}>
            <div className="px-2 pb-1 pt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
              {g.label}
            </div>
            {g.items.map((it) => (
              <DropdownMenuItem key={it.label} onClick={() => onSelect(it)} className="gap-2">
                <span className="h-4 w-4">{it.icon}</span>
                <span>{it.label}</span>
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
