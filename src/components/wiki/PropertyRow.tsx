// src/components/wiki/PropertyRow.tsx
"use client";

import type {
  UIDocPropertyRow,
  PropertyValue,
  PropertyOption,
} from "@/types/wiki";
import { useEffect, useState } from "react";
import MiniSelect from "./ui/MiniSelect";
import MiniMultiSelect from "./ui/MiniMultiSelect";
import type { ChipColor } from "./ui/chip-colors";

function opts(defOptions: PropertyOption[] | undefined): PropertyOption[] {
  return Array.isArray(defOptions) ? defOptions : [];
}

// turn `["a","b"]` <-> "a, b"
function toListString(arr: string[]) {
  return arr.join(", ");
}
function fromListString(s: string) {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

type Props = {
  row: UIDocPropertyRow;
  onChange: (next: UIDocPropertyRow) => void;
  onDelete?: (definitionId: string) => void; // parent hides this for Created/Description
};

export default function PropertyRow({ row, onChange, onDelete }: Props) {
  const def = row.definition;
  const v = row.value;

  const [confirmOpen, setConfirmOpen] = useState(false);

  // Narrow once for typed deps/usage
  const selectValue: string | null =
    v.type === "select" || v.type === "status" ? v.value : null;

  const multiValues: string[] | null =
    v.type === "multi_select" ? v.value : null;

  function update(nextValue: PropertyValue) {
    onChange({ ...row, value: nextValue });
  }

  // Ensure chosen single-select/status value exists in options
  useEffect(() => {
    const isSelectLike = def.type === "select" || def.type === "status";
    if (
      isSelectLike &&
      selectValue &&
      !opts(def.options).some((o) => o.value === selectValue)
    ) {
      const next: PropertyOption[] = [
        ...opts(def.options),
        {
          id: crypto.randomUUID(),
          value: selectValue,
          color: "gray" as ChipColor,
        },
      ];
      onChange({
        ...row,
        definition: { ...def, options: next },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def.type, def.options, selectValue]);

  // Ensure multi-select values exist in options
  useEffect(() => {
    if (def.type !== "multi_select" || !multiValues) return;
    const existing = new Set(opts(def.options).map((o) => o.value));
    const missing = multiValues.filter((val) => !existing.has(val));
    if (missing.length) {
      const extra: PropertyOption[] = missing.map((val) => ({
        id: crypto.randomUUID(),
        value: val,
        color: "gray" as ChipColor,
      }));
      onChange({
        ...row,
        definition: { ...def, options: [...opts(def.options), ...extra] },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def.type, def.options, multiValues]);

  return (
    <>
      <div className="mm-row flex items-start gap-3 text-sm">
        {/* name column (with hover-only delete) */}
        <div className="min-w-[110px] flex items-center gap-2">
          <span className="opacity-70">{def.name}</span>
          {onDelete && (
            <button
              type="button"
              className="mm-icon-btn mm-row-action"
              title={`Delete “${def.name}”`}
              aria-label={`Delete ${def.name}`}
              onClick={() => setConfirmOpen(true)}
            >
              ×
            </button>
          )}
        </div>

        {/* value editor column */}
        <div className="flex-1">
          {def.type === "text" && (
            <input
              className="h-8 w-[260px] rounded-md border bg-transparent px-2 outline-none"
              placeholder="Enter text…"
              value={v.type === "text" && v.value ? v.value : ""}
              onChange={(e) =>
                update({ type: "text", value: e.target.value || null })
              }
            />
          )}

          {def.type === "number" && (
            <input
              type="number"
              className="h-8 w-[160px] rounded-md border bg-transparent px-2 outline-none"
              placeholder="0"
              value={v.type === "number" && v.value !== null ? v.value : ""}
              onChange={(e) => {
                const n = e.target.value;
                update({ type: "number", value: n === "" ? null : Number(n) });
              }}
            />
          )}

          {def.type === "email" && (
            <input
              type="email"
              className="h-8 w-[260px] rounded-md border bg-transparent px-2 outline-none"
              placeholder="name@example.com"
              value={v.type === "email" && v.value ? v.value : ""}
              onChange={(e) =>
                update({ type: "email", value: e.target.value || null })
              }
            />
          )}

          {def.type === "date_time" && (
            <input
              type="datetime-local"
              className="h-8 rounded-md border bg-transparent px-2 outline-none"
              value={
                v.type === "date_time" && v.value
                  ? new Date(v.value).toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) => {
                const s = e.target.value;
                update({
                  type: "date_time",
                  value: s ? new Date(s).toISOString() : null,
                });
              }}
            />
          )}

          {def.type === "checkbox" && (
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={v.type === "checkbox" ? v.value : false}
                onChange={(e) =>
                  update({ type: "checkbox", value: e.target.checked })
                }
              />
              <span className="opacity-80">Checked</span>
            </label>
          )}

          {def.type === "select" && (
            <MiniSelect
              value={v.type === "select" ? v.value : null}
              options={opts(def.options).map((o: PropertyOption) => ({
                id: o.id,
                value: o.value,
                color: o.color as ChipColor | undefined,
              }))}
              onChange={(val) => update({ type: "select", value: val })}
              onAddOption={(label) => {
                const next: PropertyOption[] = [
                  ...opts(def.options),
                  {
                    id: crypto.randomUUID(),
                    value: label,
                    color: "gray" as ChipColor,
                  },
                ];
                onChange({
                  ...row,
                  definition: { ...def, options: next },
                  value: { type: "select", value: label },
                });
              }}
              onDeleteOption={(id) => {
                const next = opts(def.options).filter((o) => o.id !== id);
                const removed = opts(def.options).find((o) => o.id === id);
                const clearValue =
                  v.type === "select" && removed && v.value === removed.value;
                onChange({
                  ...row,
                  definition: { ...def, options: next },
                  value: clearValue ? { type: "select", value: null } : v,
                });
              }}
              onEditOption={(id, patch) => {
                const next: PropertyOption[] = opts(def.options).map((o) =>
                  o.id === id
                    ? {
                        ...o,
                        value: patch.value,
                        color: patch.color ?? undefined,
                      }
                    : o
                );
                const old = opts(def.options).find((o) => o.id === id);
                const fixSelect =
                  v.type === "select" && old && v.value === old.value;
                onChange({
                  ...row,
                  definition: { ...def, options: next },
                  value: fixSelect ? { type: "select", value: patch.value } : v,
                });
              }}
              onReorderOptions={(from, to) => {
                const next: PropertyOption[] = [...opts(def.options)];
                const [m] = next.splice(from, 1);
                if (!m) return;
                next.splice(to, 0, m);
                onChange({ ...row, definition: { ...def, options: next } });
              }}
            />
          )}

          {def.type === "status" && (
            <MiniSelect
              value={v.type === "status" ? v.value : null}
              options={opts(def.options).map((o: PropertyOption) => ({
                id: o.id,
                value: o.value,
                color: o.color as ChipColor | undefined,
              }))}
              placeholder="— Status —"
              variant="chip"
              onChange={(val) => update({ type: "status", value: val })}
              onAddOption={(label) => {
                const next: PropertyOption[] = [
                  ...opts(def.options),
                  {
                    id: crypto.randomUUID(),
                    value: label,
                    color: "gray" as ChipColor,
                  },
                ];
                onChange({
                  ...row,
                  definition: { ...def, options: next },
                  value: { type: "status", value: label },
                });
              }}
              onDeleteOption={(id) => {
                const next = opts(def.options).filter((o) => o.id !== id);
                const removed = opts(def.options).find((o) => o.id === id);
                const clearValue =
                  v.type === "status" && removed && v.value === removed.value;
                onChange({
                  ...row,
                  definition: { ...def, options: next },
                  value: clearValue ? { type: "status", value: null } : v,
                });
              }}
              onEditOption={(id, patch) => {
                const next: PropertyOption[] = opts(def.options).map((o) =>
                  o.id === id
                    ? {
                        ...o,
                        value: patch.value,
                        color: patch.color ?? undefined,
                      }
                    : o
                );
                const old = opts(def.options).find((o) => o.id === id);
                const fixStatus =
                  v.type === "status" && old && v.value === old.value;
                onChange({
                  ...row,
                  definition: { ...def, options: next },
                  value: fixStatus ? { type: "status", value: patch.value } : v,
                });
              }}
              onReorderOptions={(from, to) => {
                const next: PropertyOption[] = [...opts(def.options)];
                const [m] = next.splice(from, 1);
                if (!m) return;
                next.splice(to, 0, m);
                onChange({ ...row, definition: { ...def, options: next } });
              }}
            />
          )}

          {def.type === "multi_select" && (
            <MiniMultiSelect
              values={v.type === "multi_select" ? v.value : []}
              options={opts(def.options).map((o: PropertyOption) => ({
                id: o.id,
                value: o.value,
                color: o.color as ChipColor | undefined,
              }))}
              onChange={(vals) => update({ type: "multi_select", value: vals })}
              onAddOption={(label) => {
                const next: PropertyOption[] = [
                  ...opts(def.options),
                  {
                    id: crypto.randomUUID(),
                    value: label,
                    color: "gray" as ChipColor,
                  },
                ];
                const nextVals =
                  v.type === "multi_select" ? [...v.value, label] : [label];
                onChange({
                  ...row,
                  definition: { ...def, options: next },
                  value: { type: "multi_select", value: nextVals },
                });
              }}
              onDeleteOption={(id) => {
                const all = opts(def.options);
                const removed = all.find((o) => o.id === id);
                const nextOptions: PropertyOption[] = all.filter(
                  (o) => o.id !== id
                );
                const nextVals =
                  v.type === "multi_select" && removed
                    ? v.value.filter((x) => x !== removed.value)
                    : v.type === "multi_select"
                    ? v.value
                    : [];
                onChange({
                  ...row,
                  definition: { ...def, options: nextOptions },
                  value: { type: "multi_select", value: nextVals },
                });
              }}
              onEditOption={(id, patch) => {
                const next: PropertyOption[] = opts(def.options).map((o) =>
                  o.id === id
                    ? {
                        ...o,
                        value: patch.value,
                        color: patch.color ?? undefined,
                      }
                    : o
                );
                const old = opts(def.options).find((o) => o.id === id);
                const nextVals =
                  v.type === "multi_select" && old
                    ? v.value.map((x) => (x === old.value ? patch.value : x))
                    : v.type === "multi_select"
                    ? v.value
                    : [];
                onChange({
                  ...row,
                  definition: { ...def, options: next },
                  value: { type: "multi_select", value: nextVals },
                });
              }}
              onReorderOptions={(from, to) => {
                const next: PropertyOption[] = [...opts(def.options)];
                const [m] = next.splice(from, 1);
                if (!m) return;
                next.splice(to, 0, m);
                onChange({ ...row, definition: { ...def, options: next } });
              }}
            />
          )}

          {def.type === "person" && (
            <input
              className="h-8 w-[260px] rounded-md border bg-transparent px-2 outline-none"
              placeholder="user-id-1, user-id-2"
              value={v.type === "person" ? toListString(v.value) : ""}
              onChange={(e) =>
                update({
                  type: "person",
                  value: fromListString(e.target.value),
                })
              }
            />
          )}

          {def.type === "file" && (
            <span className="opacity-70">Files UI: later (upload/attach)</span>
          )}
        </div>
      </div>

      {/* Confirmation dialog */}
      {confirmOpen && onDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setConfirmOpen(false)}
          />
          <div className="relative z-[61] w-[28rem] max-w-[95vw] rounded-lg border bg-popover p-4 shadow-lg">
            <h3 className="text-base font-semibold mb-2">Delete property?</h3>
            <p className="text-sm opacity-80 mb-4">
              This will remove <span className="font-medium">“{def.name}”</span>{" "}
              and its value from this page. This action can’t be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="h-8 rounded-md border px-3 hover:bg-muted"
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="h-8 rounded-md border px-3 text-destructive border-destructive hover:bg-destructive/10"
                onClick={() => {
                  setConfirmOpen(false);
                  onDelete(def.id);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
