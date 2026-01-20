"use client";
import { Input } from "@/components/ui/input";
export default function DateTimeEditor({
  value,
  onCommit,
}: {
  value?: string | null;
  onCommit: (v: string | null) => void;
}) {
  return (
    <Input
      type="datetime-local"
      autoFocus
      defaultValue={value ?? undefined}
      onBlur={(e) => onCommit(e.target.value || null)}
      onKeyDown={(e) =>
        e.key === "Enter" &&
        onCommit((e.target as HTMLInputElement).value || null)
      }
    />
  );
}
