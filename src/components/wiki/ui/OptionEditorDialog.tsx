// src/components/wiki/ui/OptionEditorDialog.tsx
"use client";

import { useEffect, useState } from "react";
import type { ChipColor } from "./chip-colors";
import { chipClasses, CHIP_COLORS } from "./chip-colors";

type Props = {
  open: boolean;

  initialLabel: string;
  initialColor?: ChipColor;
  /** Close without saving */
  onClose: () => void;
  /** Save the patch (new value + color) to the caller */
  onSave: (patch: { value: string; color?: ChipColor }) => void;
};

export default function OptionEditorDialog({
  open,
  initialLabel,
  initialColor,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState(initialLabel ?? "");
  const [color, setColor] = useState<ChipColor | undefined>(initialColor);

  // Keep local state in sync when the dialog is opened for a different option
  useEffect(() => {
    if (open) {
      setName(initialLabel ?? "");
      setColor(initialColor);
    }
  }, [open, initialLabel, initialColor]);

  if (!open) return null;

  function save() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({ value: trimmed, color });
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* scrim */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* sheet */}
      <div className="relative z-[101] w-full max-w-2xl rounded-xl border bg-popover p-6 text-popover-foreground shadow-xl">
        <h2 className="text-lg font-semibold mb-4">Edit option</h2>

        <label className="block text-xs opacity-70 mb-2">Name</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Option name"
          className="mb-4 h-10 w-full rounded-md border bg-transparent px-3 outline-none"
        />

        <label className="block text-xs opacity-70 mb-2">Color</label>
        <div className="flex flex-wrap gap-2 mb-6">
          {CHIP_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={chipClasses(
                c,
                true,
                `${color === c ? "ring-2 ring-ring" : ""}`
              )}
              title={c}
            >
              {c}
            </button>
          ))}
          {/* none */}
          <button
            type="button"
            onClick={() => setColor(undefined)}
            className={`mm-chip rounded-full ${
              color ? "" : "ring-2 ring-ring"
            }`}
          >
            none
          </button>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="h-9 rounded-md border px-3 hover:bg-muted"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="h-9 rounded-md border px-4 bg-secondary hover:bg-muted"
            onClick={save}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
