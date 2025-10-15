"use client";
import { useState } from "react";
import { ColumnDef } from "@/modules/table/domain/types";

import TextEditor from "./editors/TextEditor";
import NumberEditor from "./editors/NumberEditor";
import CheckboxEditor from "./editors/CheckboxEditor";
import DateTimeEditor from "./editors/DateTimeEditor";
import SelectEditor from "./editors/SelectEditor";
import MultiSelectCell from "./cells/MultiSelectCell";

/* ---------- helpers ---------- */
const fmtLongDate = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

const fmtLongDateTime = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
function labelFor(options: ColumnDef["options"] = [], id?: string | null) {
  if (!id) return null;
  return options.find((o) => o.id === id)?.value ?? id;
}

function labelsFor(
  options: ColumnDef["options"] = [],
  ids: string[] | undefined | null
) {
  if (!Array.isArray(ids)) return [];
  return ids.map((id) => labelFor(options, id) ?? id);
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border/60 px-2 py-0.5 text-xs text-foreground/80">
      {children}
    </span>
  );
}

/* ---------- component ---------- */

export default function Cell({
  column,
  value,
  onCommit,
}: {
  column: ColumnDef;
  value: unknown;
  onCommit: (v: unknown) => void;
}) {
  const [editing, setEditing] = useState(false);

  const commit = (v: unknown) => {
    console.log("Cell commit (normalized payload):", {
      propertyId: column.id,
      type: column.type,
      value: v,
    });
    onCommit(v);
    setEditing(false);
  };

  // normalize for multi-select editor
  const asIds = Array.isArray(value) ? (value as string[]) : [];

  /* ---------- read view (pretty) ---------- */
  // at top of file (no need to import React in Next 13+)
  // import React from "react";

  const ReadView: React.FC = () => {
    switch (column.type) {
      case "select":
      case "status": {
        const lab = labelFor(column.options, value as string | null);
        return (
          <span className="text-foreground/80">
            {lab ?? <span className="opacity-60">—</span>}
          </span>
        );
      }
      case "multi_select": {
        const labs = labelsFor(column.options, asIds);
        return labs.length ? (
          <div className="flex flex-wrap gap-1">
            {labs.map((l, idx) => (
              <Chip key={`${column.id}-${l}-${idx}`}>{l}</Chip>
            ))}
          </div>
        ) : (
          <span className="opacity-60"> </span>
        );
      }
      case "checkbox":
        return (
          <span className="text-foreground/80">
            {(value as boolean) ? "✓" : " "}
          </span>
        );
      case "date_time": {
        const iso = value as string | null | undefined;
        if (!iso) return <span className="opacity-60">—</span>;

        // if you want DATE ONLY like the doc view:
        const pretty = fmtLongDate.format(new Date(iso));

        // or, if you want date + time, swap the line above for:
        // const pretty = fmtLongDateTime.format(new Date(iso));

        return <span className="text-foreground/80">{pretty}</span>;
      }
      case "number":
        return value != null ? (
          <span className="text-foreground/80">{String(value)}</span>
        ) : (
          <span className="opacity-60"> </span>
        );
      case "text":
      default:
        return value ? (
          <span className="text-foreground/80">{String(value)}</span>
        ) : (
          <span className="opacity-60"> </span>
        );
    }
  };

  /* ---------- render ---------- */
  return (
    <div className="px-3 py-2 text-sm">
      {editing ? (
        (() => {
          switch (column.type) {
            case "text":
              return (
                <TextEditor value={(value as string) ?? ""} onCommit={commit} />
              );
            case "number":
              return (
                <NumberEditor
                  value={(value as number) ?? null}
                  onCommit={commit}
                />
              );
            case "checkbox":
              return <CheckboxEditor value={!!value} onCommit={commit} />;
            case "date_time":
              return (
                <DateTimeEditor
                  value={(value as string | null) ?? null}
                  onCommit={commit}
                />
              );
            case "select":
            case "status":
              return (
                <SelectEditor
                  value={(value as string | null) ?? null} // holds optionId or null
                  options={column.options ?? []}
                  onCommit={commit}
                />
              );
            case "multi_select":
              return (
                <MultiSelectCell
                  options={column.options ?? []}
                  value={asIds} // array of optionIds
                  onChange={(ids) => commit(ids)} // commit array of ids
                />
              );
            default:
              return (
                <TextEditor value={String(value ?? "")} onCommit={commit} />
              );
          }
        })()
      ) : (
        <button
          className="w-full text-left"
          onClick={() => setEditing(true)}
          title="Click to edit"
        >
          <ReadView />
        </button>
      )}
    </div>
  );
}
