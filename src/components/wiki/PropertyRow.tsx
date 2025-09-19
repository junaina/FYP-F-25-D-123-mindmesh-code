// src/components/wiki/ui/PropertyRow.tsx
"use client";

import MiniSelect from "@/components/wiki/ui/MiniSelect";
import MiniMultiSelect from "@/components/wiki/ui/MiniMultiSelect";
import OptionEditorDialog from "@/components/wiki/ui/OptionEditorDialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type {
  DocPropertyRow,
  PropertyValue,
} from "@/modules/documents/domain/types";
function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // datetime-local wants local time without timezone
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

/** Convert "YYYY-MM-DDTHH:mm" (local) -> ISO */
function localInputToIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local); // interpreted as local by JS
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
export default function PropertyRow({
  row,
  onChange,
  onDelete,
  onSaveOptions,
}: {
  row: DocPropertyRow;
  onChange: (next: DocPropertyRow) => void;
  onDelete: (definitionId: string) => void;
  onSaveOptions?: (
    defId: string,
    opts: DocPropertyRow["definition"]["options"]
  ) => Promise<void> | void;
}) {
  const def = row.definition;
  const v = row.value;

  const set = (val: PropertyValue) => onChange({ ...row, value: val });

  return (
    <div className="flex items-start gap-3 py-1">
      <div className="min-w-[160px] pt-2 text-sm text-muted-foreground">
        {def.name}
      </div>

      <div className="flex-1">
        {def.type === "text" && (
          <Input
            value={v.type === "text" ? v.value ?? "" : ""}
            onChange={(e) => set({ type: "text", value: e.target.value })}
          />
        )}

        {def.type === "number" && (
          <Input
            type="number"
            value={v.type === "number" && v.value != null ? v.value : ""}
            onChange={(e) =>
              set({
                type: "number",
                value: e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
        )}

        {def.type === "email" && (
          <Input
            type="email"
            value={v.type === "email" ? v.value ?? "" : ""}
            onChange={(e) => set({ type: "email", value: e.target.value })}
          />
        )}

        {def.type === "checkbox" && (
          <div className="h-9 flex items-center">
            <Checkbox
              checked={v.type === "checkbox" ? !!v.value : false}
              onCheckedChange={(c) => set({ type: "checkbox", value: !!c })}
            />
          </div>
        )}

        {def.type === "date_time" && (
          <Input
            type="datetime-local"
            value={v.type === "date_time" ? isoToLocalInput(v.value) : ""}
            onChange={(e) =>
              set({
                type: "date_time",
                value: localInputToIso(e.target.value),
              })
            }
            className="w-full"
          />
        )}

        {(def.type === "select" || def.type === "status") && (
          <MiniSelect
            value={v.type === def.type ? v.value : null} // string | null (optionId)
            options={def.options ?? []} // PropertyOption[]
            onChange={(optId) =>
              set({ type: def.type as "select" | "status", value: optId })
            }
            pillLeftDot={def.type === "status"}
          />
        )}

        {def.type === "multi_select" && (
          <MiniMultiSelect
            values={v.type === "multi_select" ? v.value : []}
            options={def.options ?? []}
            onChange={(ids) => set({ type: "multi_select", value: ids })}
          />
        )}
        {/* person/file -> plug in your people/file pickers; keep same shape */}
        {def.type === "person" && (
          <MiniMultiSelect
            values={v.type === "person" ? v.value : []}
            options={def.options ?? []}
            onChange={(ids) => set({ type: "person", value: ids })}
          />
        )}
        {def.type === "file" && (
          <MiniMultiSelect
            values={v.type === "file" ? v.value : []}
            options={def.options ?? []}
            onChange={(ids) => set({ type: "file", value: ids })}
          />
        )}
      </div>

      {["select", "multi_select", "status"].includes(def.type) && (
        <OptionEditorDialog
          initial={[...(def.options ?? [])].sort(
            (a, b) => (a.position ?? 0) - (b.position ?? 0)
          )}
          onSave={(opts) => onSaveOptions?.(def.id, opts)}
        />
      )}

      <Button
        variant="link"
        className="text-destructive"
        onClick={() => onDelete(def.id)}
      >
        Delete
      </Button>
    </div>
  );
}
