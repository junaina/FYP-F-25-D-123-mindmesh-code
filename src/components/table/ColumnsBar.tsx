"use client";
import type { ColumnDef, PropertyType } from "@/modules/table/domain/types";
import ColumnMenu from "./ColumnMenu";

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
  // +112px for the sticky Actions column (keep in sync with RowsGrid)
  const ACTION_W = 112;
  const template = `minmax(260px,1.2fr) repeat(${columns.length}, minmax(180px,1fr)) ${ACTION_W}px`;

  return (
    <div
      className="sticky top-0 z-30 bg-muted/40"
      style={{ display: "grid", gridTemplateColumns: template }}
    >
      {/* Name header */}
      <div className="px-3 py-2 text-sm font-medium border-b border-border">
        Name
      </div>

      {/* Dynamic property headers */}
      {columns.map((c) => (
        <div
          key={c.id}
          className="px-3 py-2 text-sm font-medium border-b border-border flex items-center justify-between"
        >
          <span className="truncate">{c.name}</span>
          <ColumnMenu column={c} onRename={onRename} onDelete={onDelete} />
        </div>
      ))}

      {/* Sticky spacer/header for actions column */}
      <div
        className="
          sticky right-0 z-40
          border-b
          bg-card/95 backdrop-blur
          shadow-[inset_1px_0_0_theme(colors.border)]
          px-3 py-2 text-right text-sm text-muted-foreground
        "
        style={{ width: ACTION_W }}
        aria-hidden
      >
        {/* leave empty or put 'Actions' */}
      </div>
    </div>
  );
}
