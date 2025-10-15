"use client";
import { ColumnDef } from "@/modules/table/domain/types";
export default function MultiSelectEditor({
  value,
  options,
  onCommit,
}: {
  value: string[];
  options: NonNullable<ColumnDef["options"]>;
  onCommit: (v: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options?.map((o) => {
        const on = value?.includes(o.id);
        return (
          <button
            key={o.id}
            className={`px-2 py-1 rounded border ${on ? "bg-muted" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              const next = on
                ? value.filter((id) => id !== o.id)
                : [...(value || []), o.id];
              onCommit(next);
            }}
          >
            {o.value}
          </button>
        );
      })}
    </div>
  );
}
