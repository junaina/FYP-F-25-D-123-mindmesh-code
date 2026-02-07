"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";
import {
  type PropertyDefinitionDto,
  type SavePropertyOptionsDto,
  type PropertyValueDto,
} from "@/modules/documents/dto/doc.dto";
import {
  patchPropertyDef,
  readPropertyOptions,
  deleteProperty,
  patchPropertyValue,
} from "@/modules/documents/client/docs.api";
import {
  PROPERTY_TYPES,
  type PropertyType,
} from "@/modules/documents/domain/types";
import PropertyOptionsField from "./PropertyOptionsField";
import { GripVertical } from "lucide-react";
// shadcn sheet
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

type Option = SavePropertyOptionsDto["options"][number];

type Props = {
  projectId: string;
  docId: string;
  property: PropertyDefinitionDto;
  value?: PropertyValueDto | null;
  /** let the row update its local value immediately after we save here */
  onValueChanged?: (next: PropertyValueDto | null) => void;
  onUpdated?: (p: PropertyDefinitionDto) => void;
  onDeleted: () => void;
  children: React.ReactNode; // trigger
};

const OPTION_TYPES = new Set<PropertyType>([
  "select",
  "multi_select",
  "status",
]);

/** small helper to build a PV dto */
function makeDto(type: PropertyType, raw: unknown): PropertyValueDto {
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
      return { type, value: (raw as string | null) ?? null };
    case "select":
    case "status":
      return { type, value: (raw as string | null) ?? null };
    case "multi_select":
      return { type, value: Array.isArray(raw) ? (raw as string[]) : [] };
    case "person":
    // case "file":
    //   return { type, value: Array.isArray(raw) ? (raw as string[]) : [] };
    default:
      return { type: "text", value: null };
  }
}
export default function EditPropertyPopover({
  projectId,
  docId,
  property,
  value,
  onValueChanged,
  onUpdated,
  onDeleted,
  children,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(property.name);
  const [type, setType] = React.useState<PropertyType>(
    property.type as PropertyType
  );
  const [initialOptions, setInitialOptions] = React.useState<
    Option[] | undefined
  >(undefined);

  // mark when options were changed inside the editor so we can refetch on close
  const optionsDirtyRef = React.useRef(false);
  const [busy, setBusy] = React.useState(false);
  // local selection mirror (so we can render the “Selected” box)
  const [selected, setSelected] = React.useState<PropertyValueDto | null>(
    value ?? null
  );
  React.useEffect(() => setSelected(value ?? null), [value]);
  // load options whenever the sheet opens for option-capable types
  React.useEffect(() => {
    let active = true;
    async function load() {
      if (!open || !OPTION_TYPES.has(type) || !property.id) return;
      try {
        const res = await readPropertyOptions(projectId, docId, property.id);
        if (!active) return;
        setInitialOptions(
          (res.options ?? []).map((o, idx) => ({
            id: o.id,
            value: o.value,
            color: o.color ?? null,
            position: o.position ?? idx,
          }))
        );
      } catch (e) {
        console.error(e);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [open, type, projectId, docId, property.id]);
  // Helper: refetch options and bubble a fresh PropertyDefinitionDto upward
  const refreshAndBubble = React.useCallback(async () => {
    try {
      // Re-read latest options from the server
      const res = await readPropertyOptions(projectId, docId, property.id);
      const freshOptions: PropertyDefinitionDto["options"] = (
        res.options ?? []
      ).map((o) => ({
        id: o.id,
        value: o.value,
        color: o.color ?? null,
        position: o.position ?? null,
      }));

      // Emit a NEW object so React sees a change (no in-place mutations)
      onUpdated?.({
        id: property.id,
        name, // include newest name
        type, // include newest type
        options: freshOptions,
      });
    } catch (e) {
      console.error("Failed to refresh options:", e);
    }
  }, [projectId, docId, property.id, name, type, onUpdated]);
  // save name on blur/enter
  async function saveName() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === property.name) return;
    setBusy(true);
    try {
      const updated = await patchPropertyDef(projectId, docId, property.id, {
        name: trimmed,
      });
      onUpdated?.(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  async function changeType(next: PropertyType) {
    if (next === type) return;
    setBusy(true);
    try {
      const updated = await patchPropertyDef(projectId, docId, property.id, {
        type: next,
      });
      setType(next);
      onUpdated?.(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    setBusy(true);
    try {
      await deleteProperty(projectId, docId, property.id);
      setOpen(false);
      onDeleted?.();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }
  /** click on an option chip inside the sheet to set the value immediately */
  async function chooseSingle(optionId: string | null) {
    const next = makeDto(type, optionId);
    setBusy(true);
    try {
      await patchPropertyValue(projectId, docId, property.id, next);
      setSelected(next);
      onValueChanged?.(next);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }
  async function toggleMulti(optionId: string) {
    const current =
      selected?.type === "multi_select" && Array.isArray(selected.value)
        ? selected.value
        : [];
    const set = new Set(current);
    if (set.has(optionId)) set.delete(optionId);
    else set.add(optionId);

    const next = makeDto("multi_select", Array.from(set));
    setBusy(true);
    try {
      await patchPropertyValue(projectId, docId, property.id, next);
      setSelected(next);
      onValueChanged?.(next);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }
  /** visual “selected value” box under the Name input */
  function SelectedBox() {
    if (!OPTION_TYPES.has(type)) return null;

    const opts = initialOptions ?? [];
    if (type === "multi_select") {
      const ids =
        selected?.type === "multi_select" ? (selected.value as string[]) : [];
      return (
        <div className="mt-2 space-y-1.5">
          <Label>Selected</Label>
          <div className="min-h-10 w-full rounded-md border bg-muted/30 p-2 flex flex-wrap gap-2">
            {ids.length === 0 ? (
              <span className="text-muted-foreground text-sm">None</span>
            ) : (
              ids.map((id) => {
                const o = opts.find((x) => x.id === id);
                if (!o) return null;
                return (
                  <span
                    key={id}
                    className={`mm-chip ${String(o.color ?? "mm-chip--gray")}`}
                  >
                    <GripVertical className="h-3 w-3 opacity-70" />
                    {o.value}
                  </span>
                );
              })
            )}
          </div>
        </div>
      );
    }

    // select / status
    const id =
      selected && (selected.type === "select" || selected.type === "status")
        ? (selected.value as string | null)
        : null;
    const o = opts.find((x) => x.id === id);
    return (
      <div className="mt-2 space-y-1.5">
        <Label>Selected</Label>
        <div className="min-h-10 w-full rounded-md border bg-muted/30 p-2">
          {o ? (
            <span className={`mm-chip ${String(o.color ?? "mm-chip--gray")}`}>
              <GripVertical className="h-3 w-3 opacity-70" />
              {o.value}
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">None</span>
          )}
        </div>
      </div>
    );
  }
  /** list the options as clickable chips; single types select on click, multi toggles */
  function ClickableOptions() {
    if (!OPTION_TYPES.has(type)) return null;
    const opts = initialOptions ?? [];
    const singleId =
      selected && (selected.type === "select" || selected.type === "status")
        ? (selected.value as string | null)
        : null;
    const multiIds =
      selected?.type === "multi_select" ? (selected.value as string[]) : [];

    return (
      <div className="mt-2 max-h-56 overflow-auto rounded-md border p-2 flex flex-wrap gap-2">
        {opts.map((o) => {
          const isActive =
            (type === "multi_select" && multiIds.includes(o.id!)) ||
            (type !== "multi_select" && singleId === o.id);

          const cls = `mm-chip ${String(o.color ?? "mm-chip--gray")} ${
            isActive ? "ring-2 ring-primary" : ""
          } cursor-pointer`;
          return (
            <span
              key={o.id ?? o.value}
              className={cls}
              onClick={() =>
                type === "multi_select"
                  ? toggleMulti(o.id!)
                  : chooseSingle(o.id!)
              }
            >
              <GripVertical className="h-3 w-3 opacity-70" />
              {o.value}
            </span>
          );
        })}
      </div>
    );
  }

  function TypeMenu({
    current,
    onSelect,
  }: {
    current: PropertyType;
    onSelect: (t: PropertyType) => void;
  }) {
    return (
      <div className="grid grid-cols-2 gap-1">
        {PROPERTY_TYPES.map((t) => (
          <button
            key={t}
            className={`flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted ${
              t === current ? "ring-1 ring-primary" : ""
            }`}
            onClick={() => onSelect(t)}
          >
            <span className="capitalize">{t.replace("_", " ")}</span>
            {t === current && <span className="text-xs text-primary">✓</span>}
          </button>
        ))}
      </div>
    );
  }

  // ---- render ----
  return (
    <>
      {/* trigger */}
      <div onClick={() => setOpen(true)}>{children}</div>

      {/* unified editor in a right sidebar */}
      <Sheet
        open={open}
        onOpenChange={async (next) => {
          // If the sheet is closing and options changed inside, refetch + bubble fresh def
          if (!next && optionsDirtyRef.current) {
            await refreshAndBubble();
          }
          setOpen(next);
        }}
      >
        <SheetContent side="right" className="w-[420px] sm:w-[480px]">
          <SheetHeader>
            <SheetTitle>Edit property</SheetTitle>
            <SheetDescription className="sr-only">
              Edit property configuration
            </SheetDescription>
          </SheetHeader>

          {/* scrollable body */}
          <div className="mt-4 h-[calc(100vh-6rem)] overflow-auto pr-1">
            {/* Name */}
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void saveName();
                  }
                }}
                aria-busy={busy}
              />
            </div>
            {/* Show current selection just under the name */}
            <SelectedBox />

            {/* Type */}
            <div className="mt-3 space-y-1.5">
              <Label>Type</Label>
              <div className="rounded-md border bg-muted/30 p-2 text-sm">
                <TypeMenu current={type} onSelect={changeType} />
              </div>
            </div>

            {/* Type-specific area */}
            {OPTION_TYPES.has(type) && (
              <>
                <Separator className="my-3" />
                <PropertyOptionsField
                  projectId={projectId}
                  docId={docId}
                  propertyId={property.id}
                  initialOptions={initialOptions}
                  onFirstPersist={() => {
                    optionsDirtyRef.current = true;
                  }}
                  onSaved={async (opts) => {
                    optionsDirtyRef.current = true;
                    // build a fresh def and notify the row
                    setInitialOptions(opts);
                    onUpdated?.({
                      id: property.id,
                      name,
                      type,
                      options: opts.map((o) => ({
                        id: o.id!,
                        value: o.value,
                        color: o.color ?? null,
                        position: o.position ?? null,
                      })),
                    });
                  }}
                  clickable
                  selectionKind={type === "multi_select" ? "multi" : "single"}
                  selectedId={
                    selected?.type === "select" || selected?.type === "status"
                      ? (selected?.value as string | null)
                      : null
                  }
                  selectedIds={
                    selected?.type === "multi_select"
                      ? (selected?.value as string[])
                      : []
                  }
                  onChipClick={(id) => {
                    if (type === "multi_select") return toggleMulti(id);
                    return chooseSingle(id);
                  }}
                />
              </>
            )}

            <Separator className="my-3" />

            {/* Destructive */}
            <div className="flex items-center justify-between">
              <Button
                variant="destructive"
                size="sm"
                onClick={confirmDelete}
                disabled={busy}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
