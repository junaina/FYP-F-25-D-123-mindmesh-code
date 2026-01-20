"use client";

import * as React from "react";
import { Assignee } from "@/types/kanban";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";

type Props = {
  allUsers: Assignee[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  label?: string;
};

export function AssigneePicker({
  allUsers,
  selectedIds,
  onChange,
  label = "Add Assignees",
}: Props) {
  const [open, setOpen] = React.useState(false);

  const toggle = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    onChange(next);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 gap-1.5 rounded-md text-muted-foreground hover:text-pink-700 hover:bg-pink-50 dark:text-neutral-300 dark:hover:text-pink-300 dark:hover:bg-pink-500/15"
          aria-label={label}
          title={label}
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm">{label}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-64 p-0">
        <Command>
          <CommandInput placeholder="Search people..." />
          <CommandList>
            <CommandEmpty>No people found.</CommandEmpty>
            <CommandGroup heading="People">
              {allUsers.map((u) => {
                const checked = selectedIds.includes(u.id);
                return (
                  <CommandItem
                    key={u.id}
                    onSelect={() => toggle(u.id)}
                    className="flex items-center gap-2"
                  >
                    <Checkbox checked={checked} className="mr-2" />
                    <span className="text-sm">{u.name}</span>
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
