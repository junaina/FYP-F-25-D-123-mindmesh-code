"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { DefaultTypeIcon } from "@/modules/documents/domain/property-icons";
import type {
  PropertyTypeDto as PropertyType,
  PropertyValueDto,
  PropertyDefinitionDto,
} from "@/modules/documents/dto/doc.dto";
import EditPropertyPopover from "./EditPropertyPopover";
import PropertyValueRenderer from "./PropertyValueRenderer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { formatISO } from "date-fns";
import { patchPropertyValue } from "@/modules/documents/client/docs.api";

type Props = {
  projectId: string;
  docId: string;
  /** Single property definition coming from header: { id, name, type, options, value? } */
  property: PropertyDefinitionDto & { value?: PropertyValueDto | null };
  /** Optional explicit value override (usually not needed since value is on property) */
  value?: PropertyValueDto;
  iconOverride?: LucideIcon;
  onDeleted?: () => void;
  onUpdated?: (p: PropertyDefinitionDto) => void;
};

export default function PropertyRow({
  projectId,
  docId,
  property,
  value,
  iconOverride,
  onDeleted,
  onUpdated,
}: Props) {
  // keep a local copy of the definition (so the row updates immediately after edits)
  const [def, setDef] = React.useState(property); // was: React.useEffect(() => setDef(property), [property]);
  React.useEffect(() => {
    // only replace local def when we switched to another property entirely
    setDef((prev) => (prev?.id !== property.id ? property : prev));
  }, [property.id]);

  // local value state (defaults to embedded value, can be overridden by prop)
  const [local, setLocal] = React.useState<PropertyValueDto | undefined>(
    value ?? property.value ?? undefined
  );
  React.useEffect(() => {
    setLocal(value ?? property.value ?? undefined);
  }, [value, property.value]);

  const [open, setOpen] = React.useState(false);
  // width of the value cell so the popover can match it
  const valueRef = React.useRef<HTMLDivElement>(null);
  const [panelWidth, setPanelWidth] = React.useState<number>();

  // keep the width in sync (resizes, sidebar moves, etc.)
  React.useLayoutEffect(() => {
    if (!valueRef.current) return;
    const el = valueRef.current;

    const update = () => setPanelWidth(el.offsetWidth);
    update();

    // ResizeObserver keeps it accurate if layout changes
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  // --- Helpers ---------------------------------------------------------------

  async function save(next: PropertyValueDto) {
    setLocal(next); // optimistic
    try {
      await patchPropertyValue(projectId, docId, def.id, next);
    } catch (e) {
      // rollback on error
      setLocal(value ?? property.value ?? undefined);
      throw e;
    }
  }

  function handleValueClick(e: React.MouseEvent) {
    // allow <a> clicks (url/email) to work normally
    if ((e.target as HTMLElement).closest("a")) return;
    setOpen(true);
  }

  function makeDto(
    type: PropertyDefinitionDto["type"],
    raw: unknown
  ): PropertyValueDto {
    switch (type) {
      case "text":
      case "email":
      case "url":
        return { type, value: (raw as string | null) ?? null };
      case "number":
        return { type, value: (raw as number | null) ?? null };
      case "checkbox":
        return { type, value: !!raw };
      case "date_time":
        return { type, value: (raw as string | null) ?? null }; // ISO
      case "select":
      case "status":
        return { type, value: (raw as string | null) ?? null }; // optionId
      case "multi_select":
      case "person":
      case "file":
        return { type, value: Array.isArray(raw) ? (raw as string[]) : [] };
      default:
        return { type: "text", value: null };
    }
  }

  // --- Small editors ---------------------------------------------------------

  function TextLikeEditor({
    type, // "text" | "email" | "url"
    initial,
    placeholder,
    onCommit,
    onCancel,
  }: {
    type: "text" | "email" | "url";
    initial: string;
    placeholder: string;
    onCommit: (val: string) => Promise<void> | void;
    onCancel: () => void;
  }) {
    const [val, setVal] = React.useState(initial);
    return (
      <div className="p-2 w-64">
        <Input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={async (e) => {
            if (e.key === "Enter") await onCommit(val);
            else if (e.key === "Escape") onCancel();
          }}
          onBlur={async () => {
            await onCommit(val);
          }}
          placeholder={placeholder}
          inputMode={type === "url" ? "url" : "text"}
        />
      </div>
    );
  }

  function NumberEditor({
    initial,
    onCommit,
    onCancel,
  }: {
    initial: number | null;
    onCommit: (val: number | null) => Promise<void> | void;
    onCancel: () => void;
  }) {
    const [val, setVal] = React.useState<string>(
      initial == null ? "" : String(initial)
    );
    const commit = async () => {
      await onCommit(val === "" ? null : Number(val));
    };
    return (
      <div className="p-2 w-48">
        <Input
          type="number"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={async (e) => {
            if (e.key === "Enter") await commit();
            if (e.key === "Escape") onCancel();
          }}
          onBlur={commit}
          placeholder="Set number"
        />
      </div>
    );
  }

  function DateTimeEditor({
    initialIso,
    onCommit,
  }: {
    initialIso: string | null;
    onCommit: (iso: string | null) => Promise<void> | void;
  }) {
    const [d, setD] = React.useState<Date | undefined>(
      initialIso ? new Date(initialIso) : undefined
    );
    return (
      <div className="p-2">
        <Calendar
          mode="single"
          selected={d}
          onSelect={async (day) => {
            setD(day ?? undefined);
            await onCommit(day ? formatISO(day) : null);
          }}
        />
      </div>
    );
  }

  function SelectEditor({
    options,
    currentId,
    onCommit,
  }: {
    options: { id: string; value: string }[];
    currentId: string | null;
    onCommit: (id: string | null) => Promise<void> | void;
  }) {
    return (
      <Command>
        <CommandList>
          <CommandEmpty>No options</CommandEmpty>
          <CommandGroup>
            {options.map((o) => (
              <CommandItem
                key={o.id}
                value={o.value}
                onSelect={async () => onCommit(o.id)}
              >
                {o.value}
                {currentId === o.id && <span className="ml-auto">✓</span>}
              </CommandItem>
            ))}
            <CommandItem
              value="__clear__"
              onSelect={async () => onCommit(null)}
            >
              Clear
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    );
  }

  function MultiSelectEditor({
    options,
    selected,
    onCommit,
    onCancel,
  }: {
    options: { id: string; value: string }[];
    selected: string[];
    onCommit: (ids: string[]) => Promise<void> | void;
    onCancel: () => void;
  }) {
    const [setIds, setSetIds] = React.useState<Set<string>>(new Set(selected));
    const toggle = (id: string) => {
      const next = new Set(setIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSetIds(next);
    };
    const commit = async () => onCommit(Array.from(setIds));
    return (
      <div className="p-2 w-64">
        <Command>
          <CommandList>
            <CommandEmpty>No options</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.id}
                  value={o.value}
                  onSelect={() => toggle(o.id)}
                >
                  <Checkbox checked={setIds.has(o.id)} className="mr-2" />
                  {o.value}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="mt-2 flex justify-end gap-2">
          <button
            className="text-sm px-2 py-1 rounded bg-muted"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="text-sm px-2 py-1 rounded bg-primary text-primary-foreground"
            onClick={commit}
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  function ValueEditor() {
    const t = def.type;

    // derive current values from `local`
    const str =
      (local?.type === t ? (local?.value as string | null) : null) ?? "";
    const num =
      t === "number" && local?.type === "number"
        ? (local.value as number | null)
        : null;
    const iso =
      t === "date_time" && local?.type === "date_time"
        ? (local.value as string | null)
        : null;
    const selId =
      (t === "select" || t === "status") && local?.type === t
        ? (local.value as string | null)
        : null;
    const multi =
      t === "multi_select" && local?.type === "multi_select"
        ? (local.value as string[])
        : [];

    switch (t) {
      case "text":
      case "email":
      case "url":
        return (
          <TextLikeEditor
            type={t}
            initial={str}
            placeholder={`Set ${def.name}`}
            onCommit={async (val) => {
              await save(makeDto(t, val));
              setOpen(false);
            }}
            onCancel={() => setOpen(false)}
          />
        );

      case "number":
        return (
          <NumberEditor
            initial={num}
            onCommit={async (val) => {
              await save(makeDto("number", val));
              setOpen(false);
            }}
            onCancel={() => setOpen(false)}
          />
        );

      case "date_time":
        return (
          <DateTimeEditor
            initialIso={iso}
            onCommit={async (nextIso) => {
              await save(makeDto("date_time", nextIso));
              setOpen(false);
            }}
          />
        );

      case "select":
      case "status":
        return (
          <SelectEditor
            options={def.options.map((o) => ({ id: o.id, value: o.value }))}
            currentId={selId}
            onCommit={async (id) => {
              await save(makeDto(t, id));
              setOpen(false);
            }}
          />
        );

      case "multi_select":
        return (
          <MultiSelectEditor
            options={def.options.map((o) => ({ id: o.id, value: o.value }))}
            selected={multi}
            onCommit={async (ids) => {
              await save(makeDto("multi_select", ids));
              setOpen(false);
            }}
            onCancel={() => setOpen(false)}
          />
        );

      default:
        return null;
    }
  }

  const Icon = iconOverride ?? DefaultTypeIcon[def.type as PropertyType];
  const optionsVersion = React.useMemo(
    () => def.options.map((o) => `${o.id}:${o.value}`).join("|"),
    [def.options]
  );

  const checkboxChecked =
    def.type === "checkbox" && local?.type === "checkbox"
      ? !!local.value
      : false;

  return (
    <div className="flex items-center gap-3 rounded-md px-2 py-1 hover:bg-muted hover:shadow-sm">
      {/* LEFT: property config (rename, change type, delete) */}
      <EditPropertyPopover
        projectId={projectId}
        docId={docId}
        property={def}
        onUpdated={(updated) => {
          setDef(updated);
          onUpdated?.(updated);
        }}
        onDeleted={onDeleted ?? (() => {})}
      >
        <div className="flex min-w-[180px] items-center gap-2 cursor-pointer">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{def.name}</span>
        </div>
      </EditPropertyPopover>

      {def.type === "checkbox" ? (
        // Inline, instant toggle — no popover
        <div className="min-h-6 min-w-[12rem] rounded px-2 py-1">
          <Checkbox
            checked={checkboxChecked}
            onCheckedChange={async (c) => {
              await save(makeDto("checkbox", !!c));
            }}
            aria-label={def.name}
          />
        </div>
      ) : (
        <Popover
          key={`${def.id}:${optionsVersion}`}
          open={open}
          onOpenChange={setOpen}
        >
          <PopoverTrigger asChild>
            <div
              className="min-h-6 min-w-[12rem] cursor-pointer rounded px-2 py-1 hover:bg-muted"
              onClick={handleValueClick}
            >
              <div className="text-sm">
                <PropertyValueRenderer def={def} value={local} />
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="p-0 w-auto"
            align="end"
            key={`${def.id}-${def.type}`}
          >
            <ValueEditor />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
