"use client";
import { Row } from "@/modules/table/domain/types";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function TitleCell({
  row,
  onSave,
  underline = false,
}: {
  row: Row;
  onSave: (title: string) => Promise<any>;
  underline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(row.title);
  return (
    <div className="px-2 py-1">
      {editing ? (
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => {
            setEditing(false);
            onSave(value);
          }}
          onKeyDown={(e) =>
            e.key === "Enter" && (setEditing(false), onSave(value))
          }
        />
      ) : (
        <button
          className="text-left hover:underline"
          onClick={() => setEditing(true)}
        >
          {row.title || "Untitled"}
        </button>
      )}
    </div>
  );
}
