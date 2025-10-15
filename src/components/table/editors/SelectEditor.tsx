"use client";
import { ColumnDef } from "@/modules/table/domain/types";
export default function SelectEditor({
  value,
  options,
  onCommit,
}: {
  value?: string | null;
  options: NonNullable<ColumnDef["options"]>;
  onCommit: (v: string | null) => void;
}) {
  return (
    <select
      autoFocus
      defaultValue={value ?? ""}
      onBlur={(e) => onCommit(e.target.value || null)}
    >
      <option value="">—</option>
      {options?.map((o) => (
        <option key={o.id} value={o.id}>
          {o.value}
        </option>
      ))}
    </select>
  );
}
