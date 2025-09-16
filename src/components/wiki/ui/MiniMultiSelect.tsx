// src/components/wiki/ui/MiniMultiSelect.tsx
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

export default function MiniMultiSelect({
  values, // optionIds
  options,
  onChange,
}: {
  values: string[];
  options: PropertyOption[];
  onChange: (newIds: string[]) => void;
}) {
  const selected = useMemo(() => {
    const set = new Set(values);
    return options.filter((o) => set.has(o.id));
  }, [options, values]);

  const add = (id: string) => {
    if (!values.includes(id)) onChange([...values, id]);
  };
  const remove = (id: string) => onChange(values.filter((v) => v !== id));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {selected.map((o) => (
        <Chip
          key={o.id}
          label={o.value}
          color={o.color}
          onRemove={() => remove(o.id)}
        />
      ))}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            Add
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-64" align="start">
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandEmpty>No options</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem key={o.id} onSelect={() => add(o.id)}>
                  {o.value}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
