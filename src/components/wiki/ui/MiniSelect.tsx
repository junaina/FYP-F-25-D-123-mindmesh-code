// src/components/wiki/ui/MiniSelect.tsx
"use client";

import { useMemo } from "react";
import { Chip } from "./Chip";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import type { PropertyOption } from "@/modules/documents/domain/types";

export default function MiniSelect({
  value, // optionId | null
  options,
  onChange,
  pillLeftDot = false, // status style
}: {
  value: string | null;
  options: PropertyOption[];
  onChange: (optId: string | null) => void;
  pillLeftDot?: boolean;
}) {
  const selected = useMemo(
    () => options.find((o) => o.id === value) ?? null,
    [options, value]
  );

  return (
    <div className="flex items-center gap-2">
      {selected ? (
        <Chip
          label={selected.value}
          color={selected.color}
          className={pillLeftDot ? "pl-1.5" : ""}
          onRemove={() => onChange(null)}
        />
      ) : (
        <span className="text-muted-foreground text-sm">No selection</span>
      )}

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            Select
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-60" align="start">
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandEmpty>No options</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem key={o.id} onSelect={() => onChange(o.id)}>
                  <div className="flex items-center gap-2">
                    {pillLeftDot && (
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: o.color ?? "currentColor" }}
                      />
                    )}
                    <span>{o.value}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
