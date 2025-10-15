"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PropertyType } from "@/modules/table/domain/types";

export default function TableHeader({
  title,
  onRenameTable,
  onAddProperty,
  onNewRow,
}: {
  title: string;
  onRenameTable: (name: string) => Promise<any>;
  onAddProperty: (p: { name: string; type: PropertyType }) => Promise<any>;
  onNewRow: () => Promise<any>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);

  if (title !== value && !editing) setTimeout(() => setValue(title), 0);

  function commit() {
    setEditing(false);
    if (value.trim() && value !== title) onRenameTable(value);
    else setValue(title);
  }

  return (
    <div className="flex items-center justify-between">
      <div className="min-w-0">
        {editing ? (
          <Input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setEditing(false);
                setValue(title);
              }
            }}
            className="h-10 text-2xl font-semibold bg-transparent"
          />
        ) : (
          <button
            className="text-2xl font-semibold hover:underline text-left truncate"
            onClick={() => setEditing(true)}
          >
            {title}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          onClick={() => onAddProperty({ name: "New property", type: "text" })}
        >
          + Add property
        </Button>
        <Button onClick={onNewRow}>New row</Button>
      </div>
    </div>
  );
}
