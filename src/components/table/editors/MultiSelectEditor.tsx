// src/components/table/cells/MultiSelectCell.tsx
"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandInput,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@/modules/table/domain/types";

type Props = {
  options: NonNullable<ColumnDef["options"]>;
  value: string[]; // array of optionIds
  onChange: (ids: string[]) => void;
};

export default function MultiSelectCell({ options, value, onChange }: Props) {
  const [open, setOpen] = React.useState(false);
  const selected = new Set(value ?? []);

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange([...next]); // notify parent immediately
  };

  // show compact preview when closed
  const preview = value?.length
    ? options
        .filter((o) => selected.has(o.id))
        .map((o) => o.value)
        .join(", ")
    : "—";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-full justify-between overflow-hidden text-ellipsis whitespace-nowrap"
          onMouseDown={(e) => {
            // prevent parent cell’s click handlers from stealing focus
            e.stopPropagation();
          }}
        >
          <span
            className={cn("text-foreground/80", !value?.length && "opacity-60")}
          >
            {preview}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-64 p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandInput placeholder="Filter options..." />
          <CommandList>
            <CommandEmpty>No options.</CommandEmpty>
            <CommandGroup>
              {options.map((o) => {
                const isChecked = selected.has(o.id);
                return (
                  <CommandItem
                    key={o.id}
                    value={o.value}
                    onSelect={() => toggle(o.id)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isChecked ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {o.value}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
