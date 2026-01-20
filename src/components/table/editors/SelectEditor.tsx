"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Opt = { id: string; value: string; color?: string | null };

const CLEAR = "__CLEAR__";

export default function SelectEditor({
  value,
  options,
  onCommit,
}: {
  value: string | null;
  options: Opt[];
  onCommit: (v: string | null) => void;
}) {
  return (
    <Select
      // when null, Select shows the placeholder
      value={value ?? ""}
      onValueChange={(v) => {
        if (v === CLEAR) onCommit(null);
        else onCommit(v);
      }}
    >
      <SelectTrigger className="h-8 w-auto min-w-[7rem] max-w-[11rem] px-3">
        <SelectValue placeholder="—" />
      </SelectTrigger>

      <SelectContent>
        <SelectGroup>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.value}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
