"use client";

import { useEffect, useRef, useState } from "react";
import OptionEditorDialog from "./OptionEditorDialog";
import { chipClasses, type ChipColor } from "./chip-colors";

export type MiniSelectOption = { id: string; value: string; color?: ChipColor };

type Props = {
  value: string | null;
  options: MiniSelectOption[];
  placeholder?: string;
  onChange: (next: string | null) => void;

  onAddOption?: (label: string) => void;
  onDeleteOption?: (id: string) => void;
  onEditOption?: (
    id: string,
    patch: { value: string; color?: ChipColor }
  ) => void;

  /** choose how the trigger looks */
  variant?: "default" | "chip";

  /** Reorder the options list (drag inside dropdown) */
  onReorderOptions?: (from: number, to: number) => void;
};

export default function MiniSelect({
  value,
  options,
  placeholder = "— Select —",
  onChange,
  onAddOption,
  onDeleteOption,
  onEditOption,
  variant = "default",
  onReorderOptions,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [createLabel, setCreateLabel] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editColor, setEditColor] = useState<ChipColor | undefined>(undefined);

  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selected = value ? options.find((o) => o.value === value) : undefined;

  const filtered = search
    ? options.filter((o) =>
        o.value.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  function select(val: string | null) {
    onChange(val);
    setOpen(false);
  }

  function addOption() {
    const label = createLabel.trim();
    if (!label || !onAddOption) return;
    onAddOption(label);
    onChange(label);
    setCreateLabel("");
  }

  function openEditor(opt?: MiniSelectOption) {
    if (!opt || !onEditOption) return;
    setEditId(opt.id);
    setEditLabel(opt.value);
    setEditColor(opt.color);
  }

  function handleSaveEdit(patch: { value: string; color?: ChipColor }) {
    if (editId && onEditOption) {
      onEditOption(editId, patch);
    }
    setEditId(null);
    setEditLabel("");
    setEditColor(undefined);
  }

  // ---- trigger styles
  const isChip = variant === "chip";
  const triggerClasses = isChip
    ? chipClasses(selected?.color, true) +
      " min-w-[7rem] h-8 inline-flex items-center gap-2 bg-background"
    : "min-h-8 min-w-[12rem] rounded-md border bg-background px-2 py-1 hover:bg-muted flex items-center gap-2 text-left";

  return (
    <div ref={boxRef} className="relative inline-block">
      {/* Trigger */}
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
        className={triggerClasses}
        aria-expanded={open}
        onDoubleClick={(e) => {
          // Quick edit by double-clicking the trigger chip/text
          e.stopPropagation();
          openEditor(selected);
        }}
        title={selected ? "Double-click to edit" : undefined}
      >
        <span className={value ? "" : "opacity-60"}>
          {value ?? placeholder}
        </span>
        <span className="ml-auto pl-1" aria-hidden>
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

          <div className="max-h-56 overflow-y-auto rounded-md">
            {filtered.length === 0 && (
              <div className="px-2 py-3 text-sm opacity-60">No options</div>
            )}

            {filtered.map((o, idx) => {
              const isSelected = value === o.value;
              return (
                <div
                  key={o.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const from = Number(e.dataTransfer.getData("mm/opt"));
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
                      e.dataTransfer.setData("mm/opt", String(idx));
                    }}
                    title="Drag to reorder"
                  >
                    ⋮⋮
                  </span>

                  {/* Select checkbox */}
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => select(isSelected ? null : o.value)}
                    className={`inline-flex h-5 w-5 items-center justify-center rounded border text-xs ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "text-muted-foreground"
                    }`}
                    title={isSelected ? "Clear" : "Select"}
                  >
                    {isSelected ? "✓" : ""}
                  </button>

                  {/* Chip — click to edit */}
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

                  {/* tiny actions */}
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
