"use client";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { PropertyType, PropertyValueDto } from "@/modules/table-view/client/table.api";

// your wiki header components (adjust if your alias differs)
import PropertyValueRenderer from "@/components/wiki/header/PropertyValueRenderer";
import PropertyOptionsField from "@/components/wiki/header/PropertyOptionsField";

type Def = {
  id: string;
  name: string;
  type: PropertyType;
  options?: { id: string; value: string; color?: string | null; position?: number }[];
};

export function CellEditor({
  def,
  value,
  onChange,
  projectId,
  docId, // row's wiki doc id
}: {
  def: Def;
  value: PropertyValueDto | undefined;
  onChange: (v: PropertyValueDto) => void;
  projectId: string;
  docId: string;
}) {
  // text-like
  if (def.type === "text" || def.type === "email" || def.type === "url" || def.type === "date_time") {
    const [text, setText] = useState<string>(() => String((value as any)?.value ?? ""));
    return (
      <Input
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange({ type: def.type as any, value: e.target.value });
        }}
        className="h-8"
      />
    );
  }

  // number
  if (def.type === "number") {
    const [text, setText] = useState<string>(() => String((value as any)?.value ?? ""));
    return (
      <Input
        type="number"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange({ type: "number", value: e.target.value === "" ? null : Number(e.target.value) });
        }}
        className="h-8"
      />
    );
  }

  // checkbox
  if (def.type === "checkbox") {
    const checked = (value as any)?.value ?? false;
    return (
      <Checkbox
        checked={!!checked}
        onCheckedChange={(v) => onChange({ type: "checkbox", value: !!v })}
      />
    );
  }

  // option types → popover with your PropertyOptionsField
  if (def.type === "select" || def.type === "status" || def.type === "multi_select") {
    const selectedId = (value as any)?.value ?? null;
    const selectedIds: string[] = (value as any)?.value ?? [];
    const selectionKind = def.type === "multi_select" ? "multi" : "single";

    return (
      <Popover>
        <PopoverTrigger asChild>
          <button className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm hover:bg-muted w-full">
            <PropertyValueRenderer def={{ ...def, options: def.options ?? [] } as any} value={(value as any) ?? null} />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80">
          <PropertyOptionsField
            projectId={projectId}
            docId={docId}
            propertyId={def.id}
            initialOptions={def.options ?? []}
            clickable
            selectionKind={selectionKind}
            selectedId={selectionKind === "single" ? (selectedId as string | null) : null}
            selectedIds={selectionKind === "multi" ? (selectedIds as string[]) : []}
            onChipClick={(id) => {
              if (selectionKind === "single") {
                onChange({ type: def.type as any, value: id });
              } else {
                const set = new Set(selectedIds);
                set.has(id) ? set.delete(id) : set.add(id);
                onChange({ type: "multi_select", value: Array.from(set) });
              }
            }}
          />
        </PopoverContent>
      </Popover>
    );
  }

  // fallback read-only renderer (shouldn't hit often)
  return <PropertyValueRenderer def={{ ...def, options: def.options ?? [] } as any} value={(value as any) ?? null} />;
}
