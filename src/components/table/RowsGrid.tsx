"use client";
import { ColumnDef, Row } from "@/modules/table/domain/types";
import TitleCell from "./TitleCell";
import Cell from "./Cell";
import RowMenu from "./RowMenu";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function RowsGrid({
  projectId,
  columns,
  rows,
  onEditTitle,
  onEditCell,
  onDeleteRow,
}: {
  projectId: string;
  columns: ColumnDef[];
  rows: Row[];
  onEditTitle: (rowId: string, title: string) => void | Promise<any>;
  onEditCell: (
    rowId: string,
    propertyId: string,
    value: unknown
  ) => void | Promise<any>;
  onDeleteRow: (rowId: string) => Promise<any>;
}) {
  const template = `minmax(260px,1.2fr) repeat(${columns.length}, minmax(180px,1fr)) 112px`;
  const router = useRouter();

  return (
    // draw row separators like before
    <div className="border-b">
      {rows.map((r) => (
        <div
          key={r.id}
          className="group relative grid items-center" // <-- grid + group + relative
          style={{ gridTemplateColumns: template }} // <-- keep the dynamic template
        >
          {/* title cell */}
          <div className="px-3 py-3 border-r border-b">
            <TitleCell
              row={r}
              onSave={(title) => Promise.resolve(onEditTitle(r.id, title))}
              underline={false}
            />
          </div>

          {/* property cells */}
          {columns.map((c) => (
            <div
              key={`${r.id}-${c.id}`}
              className="px-2 py-2 border-b border-r pr-10 "
            >
              <Cell
                column={c}
                value={r.values?.[c.id] ?? null}
                onCommit={(v) => onEditCell(r.id, c.id, v)}
              />
            </div>
          ))}
          {/* sticky actions cell (always visible while horizontal scrolling) */}
          <div
            className="
              border-b
              sticky right-0 z-20
              bg-card/95 backdrop-blur
              pl-2 pr-3 py-2
              flex items-center gap-2 justify-end
              shadow-[inset_1px_0_0_theme(colors.border)]
            "
          >
            <Button
              size="sm"
              variant="secondary"
              className="h-7"
              onClick={() => router.push(`/projects/${projectId}/docs/${r.id}`)}
            >
              Open
            </Button>
            <RowMenu
              projectId={projectId}
              rowId={r.id}
              onDelete={onDeleteRow}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
