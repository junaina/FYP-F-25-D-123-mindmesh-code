"use client";
import { Input } from "@/components/ui/input";
export default function NumberEditor({
  value,
  onCommit,
}: {
  value?: number;
  onCommit: (v: number | null) => void;
}) {
  return (
    <Input
      type="number"
      autoFocus
      defaultValue={value ?? undefined}
      onBlur={(e) =>
        onCommit(e.target.value === "" ? null : Number(e.target.value))
      }
      onKeyDown={(e) =>
        e.key === "Enter" &&
        onCommit(
          e.currentTarget.value === "" ? null : Number(e.currentTarget.value)
        )
      }
    />
  );
}
