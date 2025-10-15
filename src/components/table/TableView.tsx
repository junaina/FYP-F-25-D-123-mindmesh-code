"use client";
import { useTableData } from "@/modules/table/client/useTableData";
import TableHeader from "./TableHeader";
import ColumnsBar from "./ColumnsBar";
import RowsGrid from "./RowsGrid";
import PaginationFooter from "./PaginationFooter";
import TableSkeleton from "./TableSkeleton";
type Props = { projectId: string; docId: string; collectionId: string };

export default function TableView(ids: Props) {
  const td = useTableData(ids);

  if (td.initialLoading) {
    // You can pass estimated counts if you want, or keep defaults
    return <TableSkeleton columns={3} rows={6} />;
  }
  return (
    <div className="flex flex-col gap-3">
      <TableHeader
        title={td.tableName}
        onRenameTable={td.patchTableName}
        onAddProperty={td.addColumn}
        onNewRow={td.addRow}
      />
      <div className="rounded-xl border bg-card overflow-x-auto">
        <div className="w-max min-w-full">
          <ColumnsBar
            columns={td.columns}
            onRename={td.updateColumn}
            onDelete={td.deleteColumn}
          />
          <RowsGrid
            projectId={ids.projectId} // <-- NEW
            columns={td.columns}
            rows={td.rows}
            onEditTitle={(rowId, title) => td.patchRowTitle({ rowId, title })}
            onEditCell={(rowId, propertyId, value) =>
              td.patchCell({ rowId, propertyId, value })
            }
            onDeleteRow={td.deleteRow} // <-- NEW
          />
        </div>
      </div>
      <PaginationFooter
        canLoadMore={true}
        isLoading={false}
        onLoadMore={td.loadMore}
      />
    </div>
  );
}
