"use client";

import React from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
export default function TagPicker({
  multi,
  value,
  onChange,
}: {
  multi: boolean;
  value: string | string[];
  onChange: (v: unknown) => void;
}) {
  const [draft, setDraft] = React.useState("");
  const items = React.useMemo(() => ["New", "In Progress", "Blocked", "Done", "Idea"], []);
  const selected = (Array.isArray(value) ? value : value ? [value] : []) as string[];

  const toggle = (v: string) => {
    if (!multi) return onChange(v);
    if (selected.includes(v)) onChange(selected.filter(s => s !== v));
    else onChange([...selected, v]);
  };

  return (
    <div className="px-3 py-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {selected.map(s => (
          <span key={s} className="text-xs rounded-full px-2 py-1 bg-gray-700/60 border border-gray-600">
            {s}
          </span>
        ))}
        <input
          className="bg-transparent outline-none text-gray-200 placeholder-gray-500"
          placeholder="Type to add…"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && draft.trim()) {
              toggle(draft.trim());
              setDraft("");
            }
          }}
        />
      </div>
       <ScrollArea className="w-full">
        <div className="flex gap-2 whitespace-nowrap text-sm p-1">
          {items.map(i => (
            <button
              key={i}
              onClick={() => toggle(i)}
              className={`rounded-md px-2 py-1 border ${
                selected.includes(i) ? "border-gray-400" : "border-gray-700 hover:border-gray-500"
              }`}
            >
              {i}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
