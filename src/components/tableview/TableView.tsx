"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  fetchCollection,
  fetchRows,
  createRow,
  patchRow,
  type PropertyValueDto,
  type TableRowsResponse,
} from "@/modules/table-view/client/table.api";
import { TableHeader } from "./TableHeader";
import { CellEditor } from "./CellEditor";

// wiki header column editor
import EditPropertyPopover from "@/components/wiki/header/EditPropertyPopover";

export function TableView({
  projectId,
  docId,
  collectionId,
  onOpenRow,
}: {
  projectId: string;
  docId: string;            // parent doc that owns the collection
  collectionId: string;
  onOpenRow?: (rowId: string) => void; // navigate to wiki UI
}) {
  const [collectionName, setCollectionName] = useState<string>("Table");
  const [columns, setColumns] = useState<TableRowsResponse["columns"]>([]);
  const [rows, setRows] = useState<
    { id: string; title: string; properties: Record<string, PropertyValueDto | undefined> }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function load() {
    setLoading(true);
    const [col, r] = await Promise.all([
      fetchCollection(projectId, collectionId),
      fetchRows(projectId, docId, collectionId),
    ]);
    setCollectionName(col.name);
    setColumns(r.columns);
    setRows(r.rows);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, docId, collectionId]);

  async function addRow() {
    const created = await createRow(projectId, docId, collectionId, { title: "New page" });
    await load();
    if (onOpenRow) onOpenRow(created.id);
    else router.push(`/app/docs/${projectId}/${created.id}`); // <-- replace with your wiki UI route if different
  }

  return (
    <div className="rounded-2xl border shadow-sm overflow-hidden">
      <TableHeader
        initialName={collectionName}
        projectId={projectId}
        docId={docId}
        collectionId={collectionId}
        onPropertyAdded={() => load()}
      />

      <div className="px-2 pb-2">
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground w-[28rem]">Title</th>
                {columns.map((c: TableRowsResponse["columns"][number]) => (
                  <th key={c.id} className="text-left py-2 px-3 font-medium text-muted-foreground">
                    <EditPropertyPopover
                      projectId={projectId}
                      docId={docId}
                      property={{
                        id: c.id,
                        name: c.name,
                        type: c.type as any,
                        options: (c.options ?? []).map((o) => ({
                          id: o.id,
                          value: o.value,
                          color: o.color ?? null,
                          position: o.position ?? null,
                        })),
                      }}
                      onUpdated={(p) => {
                        setColumns((prev: TableRowsResponse["columns"]) =>
                          prev.map((x) =>
                            x.id === p.id ? { ...x, name: p.name, type: p.type as any, options: p.options as any } : x
                          )
                        );
                      }}
                      onDeleted={() => void load()}
                    >
                      <div className="inline-flex cursor-pointer items-center gap-1 hover:text-foreground">
                        {c.name}
                      </div>
                    </EditPropertyPopover>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((r: { id: string; title: string; properties: Record<string, PropertyValueDto | undefined> }) => (
                <tr key={r.id} className="hover:bg-muted/40 border-b">
                  <td className="py-2 px-3">
                    <button
                      className="text-left truncate w-full hover:underline"
                      onClick={() => {
                        if (onOpenRow) return onOpenRow(r.id);
                        router.push(`/app/docs/${projectId}/${r.id}`); // <-- replace if needed
                      }}
                    >
                      {r.title || "Untitled"}
                    </button>
                  </td>

                  {columns.map((c: TableRowsResponse["columns"][number]) => (
                    <td key={c.id} className="py-2 px-3">
                      <CellEditor
                        def={c}
                        value={r.properties?.[c.id]}
                        projectId={projectId}
                        docId={r.id} // pass ROW doc id (wiki)
                        onChange={async (v) => {
                          await patchRow(projectId, docId, collectionId, r.id, {
                            properties: { [c.id]: v },
                          });
                          setRows((old) =>
                            old.map((x) =>
                              x.id === r.id ? { ...x, properties: { ...x.properties, [c.id]: v } } : x
                            )
                          );
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}

              <tr>
                <td className="py-2 px-3" colSpan={1 + columns.length}>
                  <Button variant="ghost" size="sm" onClick={addRow} className="gap-2">
                    + New page
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {loading && <div className="p-4 text-sm text-muted-foreground">Loading…</div>}
      </div>
    </div>
  );
}
