"use client";

import React from "react";
import { PropertySchema, PropertyValue, Person, ID } from "@/types/calendar";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as DayPicker } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { X } from "lucide-react";

type Props = {
  schema: PropertySchema;
  value: PropertyValue | undefined;
  onChange: (val: PropertyValue) => void;
  people: Person[];
};

export default function PropertyEditors({
  schema,
  value,
  onChange,
  people,
}: Props) {
  return (
    <div className="grid grid-cols-[160px_1fr] items-center gap-2">
      <Label className="text-sm text-muted-foreground">{schema.name}</Label>

      {/* Editor */}
      {(() => {
        switch (schema.kind) {
          case "text": {
            const v = value?.kind === "text" ? value.value : "";
            return (
              <Input
                value={v}
                onChange={(e) =>
                  onChange({ kind: "text", value: e.target.value })
                }
              />
            );
          }

          case "number": {
            const v = value?.kind === "number" ? value.value : null;
            return (
              <Input
                type="number"
                value={v ?? ""}
                onChange={(e) =>
                  onChange({
                    kind: "number",
                    value:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            );
          }

          case "select": {
            const v = value?.kind === "select" ? value.optionId : null;
            return (
              <Select
                value={v ?? undefined}
                onValueChange={(id) =>
                  onChange({ kind: "select", optionId: id })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {schema.options?.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }

          case "status": {
            const v = value?.kind === "status" ? value.optionId : null;
            return (
              <Select
                value={v ?? undefined}
                onValueChange={(id) =>
                  onChange({ kind: "status", optionId: id })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Set status" />
                </SelectTrigger>
                <SelectContent>
                  {schema.options?.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }

          case "multi_select": {
            const selectedIds: ID[] =
              value?.kind === "multi_select" ? value.optionIds : [];

            return (
              <div className="flex flex-wrap items-center gap-2">
                {selectedIds.map((id) => {
                  const opt = schema.options?.find((o) => o.id === id);
                  if (!opt) return null;
                  return (
                    <Badge key={id} variant="outline" className="gap-1">
                      {opt.label}
                      <button
                        className="ml-1 opacity-60 hover:opacity-100"
                        onClick={() =>
                          onChange({
                            kind: "multi_select",
                            optionIds: selectedIds.filter((x) => x !== id),
                          })
                        }
                        aria-label={`Remove ${opt.label}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}

                <AddOptionPopover
                  options={(schema.options ?? []).map((o) => ({
                    id: o.id,
                    label: o.label,
                  }))}
                  onPick={(id) => {
                    if (!selectedIds.includes(id)) {
                      onChange({
                        kind: "multi_select",
                        optionIds: [...selectedIds, id],
                      });
                    }
                  }}
                />
              </div>
            );
          }

          case "checkbox": {
            const v = value?.kind === "checkbox" ? value.value : false;
            return (
              <div className="flex items-center gap-2">
                <Switch
                  checked={v}
                  onCheckedChange={(c) =>
                    onChange({ kind: "checkbox", value: c })
                  }
                />
              </div>
            );
          }

          case "url": {
            const v = value?.kind === "url" ? value.value ?? "" : "";
            return (
              <Input
                type="url"
                placeholder="https://…"
                value={v}
                onChange={(e) =>
                  onChange({ kind: "url", value: e.target.value })
                }
              />
            );
          }

          case "date": {
            const v =
              value?.kind === "date" && value.value
                ? new Date(value.value)
                : null;
            return (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    {v ? v.toLocaleDateString() : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <DayPicker
                    mode="single"
                    selected={v ?? undefined}
                    onSelect={(d) =>
                      onChange({
                        kind: "date",
                        value: d ? d.toISOString() : null,
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            );
          }

          case "person": {
            const selectedIds: ID[] =
              value?.kind === "person" ? value.userIds : [];
            const selectedPeople = people.filter((p) =>
              selectedIds.includes(p.id)
            );

            return (
              <div className="flex flex-wrap items-center gap-2">
                {selectedPeople.map((p) => (
                  <Badge key={p.id} variant="secondary" className="gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[10px]">
                        {p.name.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    {p.name}
                    <button
                      className="ml-1 opacity-60 hover:opacity-100"
                      onClick={() =>
                        onChange({
                          kind: "person",
                          userIds: selectedIds.filter((x) => x !== p.id),
                        })
                      }
                      aria-label={`Remove ${p.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}

                <AddOptionPopover
                  options={people.map((p) => ({ id: p.id, label: p.name }))}
                  onPick={(id) => {
                    if (!selectedIds.includes(id)) {
                      onChange({
                        kind: "person",
                        userIds: [...selectedIds, id],
                      });
                    }
                  }}
                />
              </div>
            );
          }
        }
      })()}
    </div>
  );
}

/** Small “+ Add” picker with search, used for multi_select and person */
function AddOptionPopover({
  options,
  onPick,
}: {
  options: { id: string; label: string }[];
  onPick: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((o) => o.label.toLowerCase().includes(needle));
  }, [options, q]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Add option">
          + Add
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search…" value={q} onValueChange={setQ} />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            {filtered.map((o) => (
              <CommandItem
                key={o.id}
                value={o.label}
                onSelect={() => {
                  onPick(o.id);
                  setOpen(false);
                  setQ("");
                }}
              >
                {o.label}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
