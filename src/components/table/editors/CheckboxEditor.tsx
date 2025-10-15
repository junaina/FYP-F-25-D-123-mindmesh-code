"use client";
import { Checkbox } from "@/components/ui/checkbox";
export default function CheckboxEditor({
  value,
  onCommit,
}: {
  value?: boolean;
  onCommit: (v: boolean) => void;
}) {
  return <Checkbox checked={!!value} onCheckedChange={(v) => onCommit(!!v)} />;
}
