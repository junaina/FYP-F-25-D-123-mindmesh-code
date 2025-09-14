"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import OptionEditorDialog from "./OptionEditorDialog";
import { chipClasses, type ChipColor } from "./chip-colors";

export type MiniSelectOption = {
  id: string;
  value: string;
  color?: ChipColor;
};

type Props = {
  values: string[];
  options: MiniSelectOption[];
  placeholder?: string;
  onChange: (next: string[]) => void;

  onAddOption?: (label: string) => void;
  onDeleteOption?: (id: string) => void;
  onEditOption?: (
    id: string,
    patch: { value: string; color?: ChipColor }
  ) => void;

  /** Reorder the options list (drag inside dropdown) */
  onReorderOptions?: (from: number, to: number) => void;
  /** Reorder selected values (drag chips in trigger); if not provided we apply local reorder via onChange */
  onReorderValues?: (from: number, to: number) => void;
};

export default function MiniMultiSelect({
  values,
  options,
  placeholder = "— Select —",
  onChange,
  onAddOption,
  onDeleteOption,
  onEditOption,
  onReorderOptions,
  onReorderValues,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [createLabel, setCreateLabel] = useState("");

  // edit dialog state
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editColor, setEditColor] = useState<ChipColor | undefined>(undefined);

  const boxRef = useRef<HTMLDivElement>(null);

  // close popover on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const byValue = useMemo(
    () => new Map(options.map((o) => [o.value, o] as const)),
    [options]
  );

  const filtered = search
    ? options.filter((o) =>
        o.value.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  function toggle(val: string) {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  }

  function addOption() {
    const label = createLabel.trim();
    if (!label || !onAddOption) return;
    onAddOption(label);
    onChange([...values, label]);
    setCreateLabel("");
  }

  function openEditor(option: MiniSelectOption | undefined) {
    if (!option || !onEditOption) return;
    setEditId(option.id);
    setEditLabel(option.value);
    setEditColor(option.color);
  }

  function handleSaveEdit(patch: { value: string; color?: ChipColor }) {
    if (editId && onEditOption) {
      onEditOption(editId, patch);
    }
    setEditId(null);
    setEditLabel("");
    setEditColor(undefined);
  }

  // --- drag helpers
  const DND_OPT = "mm/opt";
  const DND_VAL = "mm/val";
  const reorder = <T,>(arr: T[], from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return arr;
    const copy = [...arr];
    const [m] = copy.splice(from, 1);
    copy.splice(to, 0, m);
    return copy;
  };

  return (
    <div ref={boxRef} className="relative inline-block">
      {/* Trigger with chips; wraps and can be reordered via drag handle on each chip */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((s) => !s)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((s) => !s);
          }
        }}
        className="min-h-8 min-w-[12rem] rounded-md border bg-background px-2 py-1 hover:bg-muted text-left flex items-start gap-2"
        aria-expanded={open}
      >
        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-6">
          {values.length ? (
            values.map((v, idx) => {
              const opt = byValue.get(v);
              return (
                <span
                  key={`${v}-${idx}`}
                  className={chipClasses(
                    opt?.color,
                    true,
                    "select-none cursor-grab active:cursor-grabbing"
                  )}
                  draggable
                  onDragStart={(e) => {
                    e.stopPropagation();
                    e.dataTransfer.setData(DND_VAL, String(idx));
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const from = Number(e.dataTransfer.getData(DND_VAL));
                    if (Number.isNaN(from)) return;
                    const apply = onReorderValues
                      ? () => onReorderValues(from, idx)
                      : () => onChange(reorder(values, from, idx));
                    apply();
                  }}
                  title={v}
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditor(opt);
                  }}
                >
                  <span className="opacity-60 mr-1">⋮⋮</span>
                  <span className="truncate max-w-[10rem]">{v}</span>
                  {/* remove */}
                  <button
                    type="button"
                    className="ml-1 rounded px-1 hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(values.filter((x) => x !== v));
                    }}
                    aria-label={`Remove ${v}`}
                  >
                    ×
                  </button>
                </span>
              );
            })
          ) : (
            <span className="opacity-60">{placeholder}</span>
          )}
        </div>
        <span className="ml-auto pl-1 leading-6" aria-hidden>
          ▾
        </span>
      </div>

      {/* Popover */}
      {open && (
        <div className="absolute z-50 mt-1 w-[26rem] rounded-md border bg-popover text-popover-foreground shadow-md p-2">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="mb-2 h-8 w-full rounded-md border bg-transparent px-2 outline-none"
          />

          {/* Options (scrollable) */}
          <div className="max-h-56 overflow-y-auto rounded-md">
            {filtered.length === 0 && (
              <div className="px-2 py-3 text-sm opacity-60">No options</div>
            )}

            {filtered.map((o, idx) => {
              const selected = values.includes(o.value);
              return (
                <div
                  key={o.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const from = Number(e.dataTransfer.getData(DND_OPT));
                    if (!Number.isNaN(from) && onReorderOptions) {
                      onReorderOptions(from, idx);
                    }
                  }}
                >
                  {/* Grip to reorder options */}
                  <span
                    className="opacity-60 cursor-grab active:cursor-grabbing select-none px-1"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(DND_OPT, String(idx));
                    }}
                    title="Drag to reorder"
                  >
                    ⋮⋮
                  </span>

                  {/* checkbox to toggle selection */}
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggle(o.value)}
                    className={`inline-flex h-5 w-5 items-center justify-center rounded border text-xs ${
                      selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "text-muted-foreground"
                    }`}
                    title={selected ? "Unselect" : "Select"}
                  >
                    {selected ? "✓" : ""}
                  </button>

                  {/* the chip itself – click opens editor */}
                  <button
                    type="button"
                    className={chipClasses(o.color, true)}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditor(o);
                    }}
                    title="Edit option"
                  >
                    {o.value}
                  </button>

                  {/* tiny pencil / remove (kept for convenience) */}
                  <div className="ml-auto flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Edit"
                      className="rounded p-1 text-xs opacity-70 hover:opacity-100 hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditor(o);
                      }}
                    >
                      ✎
                    </button>
                    {onDeleteOption && (
                      <button
                        type="button"
                        aria-label="Delete"
                        className="rounded p-1 text-xs opacity-70 hover:opacity-100 hover:bg-muted"
                        onClick={() => onDeleteOption(o.id)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Create new */}
          {onAddOption && (
            <div className="mt-2 flex items-center gap-2">
              <input
                value={createLabel}
                onChange={(e) => setCreateLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addOption();
                  if (e.key === "Escape") setOpen(false);
                }}
                placeholder="New option..."
                className="h-8 flex-1 rounded-md border bg-transparent px-2 outline-none"
              />
              <button
                type="button"
                className="h-8 rounded-md border px-3 hover:bg-muted"
                onClick={addOption}
              >
                Add
              </button>
            </div>
          )}
        </div>
      )}

      {/* Edit option dialog */}
      {editId && (
        <OptionEditorDialog
          open={!!editId}
          initialLabel={editLabel}
          initialColor={editColor}
          onClose={() => {
            setEditId(null);
            setEditLabel("");
            setEditColor(undefined);
          }}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
