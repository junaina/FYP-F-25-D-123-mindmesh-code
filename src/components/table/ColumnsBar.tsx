"use client";
import type { ColumnDef } from "@/modules/table/domain/types";
import ColumnMenu from "./ColumnMenu"; // <-- default import
import type { PropertyType } from "@/modules/table/domain/types";
export default function ColumnsBar({
  columns,
  onRename,
  onDelete,
}: {
  columns: ColumnDef[];
  onRename: (p: {
    propertyId: string;
    name?: string;
    type?: PropertyType;
  }) => Promise<any>;
  onDelete: (p: { propertyId: string }) => Promise<any>;
}) {
  const template = `minmax(260px,1.2fr) repeat(${columns.length}, minmax(180px,1fr))`;

  return (
    <div
      className="sticky top-0 z-10 bg-muted/40"
      style={{ display: "grid", gridTemplateColumns: template }}
    >
      <div className="px-3 py-2 text-sm font-medium border-b border-border">
        Name
      </div>

      {columns.map((c) => (
        <div
          key={c.id}
          className="px-3 py-2 text-sm font-medium border-b border-border flex items-center justify-between"
        >
          <span>{c.name}</span>
          <ColumnMenu column={c} onRename={onRename} onDelete={onDelete} />
        </div>
      ))}
    </div>
  );
}
