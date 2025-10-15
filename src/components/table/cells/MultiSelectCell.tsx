"use client";
import { useMemo } from "react";
import type { PropertyOption } from "@/modules/table/domain/types";
import { cn } from "@/lib/utils"; // or your own classnames helper

type Props = {
  options: PropertyOption[];
  value?: string[] | null; // array of optionIds
  onChange: (next: string[]) => void; // commit immediately
  disabled?: boolean;
};

export default function MultiSelectCell({
  options,
  value,
  onChange,
  disabled,
}: Props) {
  const selected = useMemo(() => new Set(value ?? []), [value]);

  function toggle(id: string) {
    if (disabled) return;
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange([...next]);
  }

  if (!options?.length) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isOn = selected.has(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            className={cn(
              "rounded-md px-2 py-1 text-sm transition-colors",
              "border",
              isOn
                ? "border-transparent bg-muted-foreground/20"
                : "border-border hover:bg-muted/40",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            aria-pressed={isOn}
          >
            {opt.value}
          </button>
        );
      })}
    </div>
  );
}
