"use client";
import { Input } from "@/components/ui/input";
export default function TextEditor({
  value,
  onCommit,
}: {
  value?: string;
  onCommit: (v: string) => void;
}) {
  return (
    <Input
      autoFocus
      defaultValue={value ?? ""}
      onBlur={(e) => onCommit(e.target.value)}
      onKeyDown={(e) =>
        e.key === "Enter" && onCommit((e.target as HTMLInputElement).value)
      }
    />
  );
}
