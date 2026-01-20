"use client";
import { useEffect, useMemo, useState } from "react";
import type {
  ColumnDef,
  Row,
  PropertyType,
  PropertyOption,
} from "../domain/types";
import { tableApi } from "./table.api";
import type { RowsPage } from "../domain/types";
type Ids = { projectId: string; docId: string; collectionId: string };

type RowsApi = {
  rows: Array<{
    id: string;
    title: string;
    properties: Array<{
      id: string;
      type: string;
      options: { id: string; value: string; color?: string }[];
      value: null | {
        valueString?: string | null;
        valueNumber?: number | null;
        valueBool?: boolean | null;
        valueDate?: string | null;
        valueJson?: any;
        optionId?: string | null;
        option?: { id: string; value: string } | null;
      };
    }>;
  }>;
  nextCursor: string | null;
};

function normalizeCell(prop: any) {
  const v = prop.value ?? {};
  switch (prop.type) {
    case "select":
    case "status":
      return v.optionId ?? null;
    case "multi_select":
      return Array.isArray(v.valueJson) ? v.valueJson : [];
    case "text":
      return v.valueString ?? "";
    case "number":
      return v.valueNumber ?? null;
    case "date_time":
      return v.valueDate ?? null;
    case "checkbox":
      return v.valueBool ?? false;
    default:
      return null;
  }
}
function adaptRowsFromApi(apiRows: any[]): Row[] {
  return apiRows.map((r) => {
    const properties = Array.isArray(r.properties) ? r.properties : [];
    const values: Record<string, any> = {};

    for (const p of properties) {
      const v = p.value ?? {};
      let cellValue: any = null;

      switch (p.type) {
        case "email": // ← add
        case "url": // ← optional
          cellValue =
            v.valueString !== null && v.valueString !== undefined
              ? v.valueString
              : null;
          break;
        case "text":
          cellValue =
            v.valueString !== null && v.valueString !== undefined
              ? v.valueString
              : null;
          break;

        case "number":
          cellValue = v.valueNumber ?? null;
          break;

        case "checkbox":
          cellValue = v.valueBool ?? false;
          break;

        case "date_time":
          cellValue = v.valueDate ?? null;
          break;

        case "select":
          cellValue = v.option?.id ?? v.optionId ?? null;
          break;

        case "multi_select":
          cellValue = Array.isArray(v.valueJson) ? v.valueJson : [];
          break;

        default:
          cellValue = null;
      }

      values[p.id] = cellValue;
    }

    return {
      id: r.id,
      title: r.title ?? "Untitled",
      values,
    };
  });
}

export function useTableData(ids: Ids) {
  const [initialLoading, setInitialLoading] = useState(true);
  const [columns, setColumns] = useState<ColumnDef[]>([]);
  const [pages, setPages] = useState<RowsPage[]>([]);
  const [tableName, setTableName] = useState<string>("Table");
  const rows = useMemo(() => pages.flatMap((p) => p.rows), [pages]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [cols, first] = await Promise.all([
          tableApi.getColumns(ids),
          tableApi.getRows({ ...ids, limit: 50 }),
        ]);

        if (!mounted) return;

        if (Array.isArray(cols)) setColumns(cols);

        setPages([first]);
      } catch (e) {
        console.log("HOOK:init failed (using mock)", e);
      } finally {
        if (mounted) setInitialLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [ids]);

  async function loadMore() {
    const cursor = pages.at(-1)?.nextCursor ?? null;
    if (!cursor) return;

    const next = await tableApi.getRows({ ...ids, limit: 20, cursor });
    setPages((prev) => [...prev, next]);
  }

  async function addRow() {
    const created = await tableApi.createRow(ids);
    setPages((prev) => {
      if (prev.length === 0) return [{ rows: [created], nextCursor: null }];
      const [first, ...rest] = prev;
      return [{ ...first, rows: [created, ...first.rows] }, ...rest];
    });
  }

  async function patchRowTitle(p: { rowId: string; title: string }) {
    console.log("HOOK:patchRowTitle", p);
    setPages((prev) => {
      const next = structuredClone(prev);
      next.forEach((pg) =>
        pg.rows.forEach((r) => {
          if (r.id === p.rowId) r.title = p.title;
        })
      );
      return next;
    });
    await tableApi.patchRowTitle({ ...ids, ...p });
  }
  async function addColumn(p: {
    name: string;
    type: PropertyType;
    options?: Array<Pick<PropertyOption, "value" | "color">>;
  }) {
    const created = await tableApi.createColumn({
      ...ids,
      name: p.name,
      type: String(p.type),
      options: p.options?.map((opt) => ({
        value: opt.value,
        color: opt.color ?? undefined,
      })),
    }); 
    if (created !== undefined && created !== null) {
      setColumns((c) => [...c, created]);
    }
  }

  async function updateColumn(p: {
    propertyId: string;
    name?: string;
    type?: PropertyType;
  }) {
    console.log("HOOK:updateColumn", p);
    const prev = columns;
    setColumns((cols) =>
      cols.map((c) =>
        c.id === p.propertyId
          ? { ...c, name: p.name ?? c.name, type: p.type ?? c.type }
          : c
      )
    );
    try {
      await tableApi.updateColumn({ ...ids, ...p });
    } catch (e) {
      setColumns(prev);
      throw e;
    }
  }

  async function deleteColumn(p: { propertyId: string }) {
    console.log("HOOK:deleteColumn", p);
    const prev = columns;
    setColumns((cols) => cols.filter((c) => c.id !== p.propertyId));
    try {
      await tableApi.deleteColumn({ ...ids, ...p });
    } catch (e) {
      setColumns(prev); 
      throw e;
    }
  }
  async function deleteRow(rowId: string) {
 
    const prev = pages;
    setPages((p) =>
      p.map((pg) => ({ ...pg, rows: pg.rows.filter((r) => r.id !== rowId) }))
    );

    try {
      await tableApi.deleteRow({ ...ids, rowId });
    } catch (e) {
      setPages(prev);
      console.error("deleteRow failed", e);
      throw e;
    }
  }
  async function patchCell(p: {
    rowId: string;
    propertyId: string;
    value: unknown;
  }) {
    console.log("HOOK:patchCell", p);
    const prev = pages;
    const col = columns.find((c) => c.id === p.propertyId);
    let normalized = p.value;

    if (col?.type === "text" && typeof p.value === "string") {
      normalized = p.value;
    }
    if (col?.type === "select" && typeof p.value === "object") {
      const val = p.value as { id?: string };
      normalized = val.id ?? null;
    }
    if (col?.type === "multi_select" && Array.isArray(p.value)) {
      normalized = p.value;
    }

    setPages((old) =>
      old.map((pg) => ({
        ...pg,
        rows: pg.rows.map((r) =>
          r.id === p.rowId
            ? { ...r, values: { ...r.values, [p.propertyId]: normalized } }
            : r
        ),
      }))
    );

    try {
      const col = columns.find((c) => c.id === p.propertyId);
      await tableApi.patchCell({
        ...ids,
        rowId: p.rowId,
        propertyId: p.propertyId,
        type: String(col?.type ?? "text"),
        value: p.value,
      });
    } catch (e) {
      setPages(prev); 
      throw e;
    }
  }
  async function patchTableName(name: string) {
    console.log("HOOK:patchTableName", { name });
    const prev = tableName;
    setTableName(name);
    try {
      await tableApi.updateTable({ ...ids, name });
    } catch (e) {
      setTableName(prev); 
      throw e;
    }
  }
  return {
    initialLoading,
    columns,
    rows,
    tableName,
    patchTableName,
    loadMore,
    addRow,
    addColumn,
    updateColumn,
    deleteColumn,
    deleteRow,
    patchRowTitle,
    patchCell,
  };
}
