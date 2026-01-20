import type { ColumnDef, RowsPage, Row } from "../domain/types";

type Ids = { projectId: string; docId: string; collectionId: string };

const base = (ids: Ids) =>
  `/api/projects/${ids.projectId}/docs/${ids.docId}/collections/${ids.collectionId}/table`;
function normalizeRow(apiRow: any): Row {
  const values: Record<string, unknown> = {};
  if (Array.isArray(apiRow.properties)) {
    for (const p of apiRow.properties) {
      const v = p.value ?? {};
      let cellValue: any = null;

      switch (p.type) {
        case "email":
        case "url":
          cellValue = v.valueString ?? "";
          break;
        case "text":
          cellValue = v.valueString ?? "";
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
        case "status":
          cellValue = v.optionId ?? v.option?.id ?? null;
          break;
        case "multi_select":
          cellValue = Array.isArray(v.valueJson) ? v.valueJson : [];
          break;
        default:
          cellValue = null;
      }

      values[p.id] = cellValue;
    }
  }

  return {
    id: apiRow.id,
    title: apiRow.title ?? apiRow.name ?? "Untitled",
    values,
  };
}

export const tableApi = {
  async getColumns(ids: Ids): Promise<ColumnDef[]> {
    const url = `${base(ids)}/columns`;
    console.log("API:getColumns", { url, ids });
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("getColumns failed");
    return res.json() as Promise<ColumnDef[]>;
  },
  async updateTable(ids: Ids & { name: string }) {
    const url = `${base(ids)}`; // PATCH the table resource
    console.log("API:updateTable", { url, ids });
    await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: ids.name }),
    });
  },
  async getRows(
    ids: Ids & { limit?: number; cursor?: string | null }
  ): Promise<RowsPage> {
    const u = new URL(base(ids), location.origin);
    if (ids.limit) u.searchParams.set("limit", String(ids.limit));
    if (ids.cursor) u.searchParams.set("cursor", ids.cursor);

    const res = await fetch(u.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(`getRows ${res.status}`);

    const data = await res.json();
    console.log("API:getRows RAW →", data);

  
    const apiRows = Array.isArray(data?.rows?.rows)
      ? data.rows.rows
      : Array.isArray(data?.rows)
      ? data.rows
      : [];

    const rows = apiRows.map(normalizeRow);
    const nextCursor = (data?.rows?.nextCursor ?? data?.nextCursor ?? null) as
      | string
      | null;

    return { rows, nextCursor };
  },

  async createRow(ids: Ids, title?: string): Promise<Row> {
    const url = `${base(ids)}/rows`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error(`createRow ${res.status}`);
    const apiRow = await res.json();
    return normalizeRow(apiRow);
  },

  async patchRowTitle(ids: Ids & { rowId: string; title: string }) {
    const url = `${base(ids)}/rows/${ids.rowId}`;
    console.log("API:patchRowTitle", { url, ids });
    await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: ids.title }),
    });
  },

  async patchCell(p: {
    projectId: string;
    docId: string;
    collectionId: string;
    rowId: string;
    propertyId: string;
    type: string; 
    value: unknown;
  }) {
    const { projectId, docId, collectionId, rowId, propertyId, type, value } =
      p;
    const url = `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/table/rows/${rowId}/cells/${propertyId}`;

    const body =
      type === "multi_select"
        ? { type, value: Array.isArray(value) ? value : [] }
        : { type, value: value ?? null };

    const r = await fetch(url, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`PATCH ${url} failed ${r.status}`);
  },
  async createColumn(
    ids: Ids & {
      name: string;
      type: string;
      options?: { value: string; color?: string }[];
    }
  ) {
    const url = `${base(ids)}/columns`;
    console.log("API:createColumn", { url, ids });
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: ids.name,
        type: ids.type,
        options: ids.options ?? [],
      }),
    });
    if (!res.ok) throw new Error(`createColumn ${res.status}`);
    return (await res.json()) as ColumnDef;
  },

  async updateColumn(
    ids: Ids & { propertyId: string; name?: string; type?: string }
  ) {
    const url = `${base(ids)}/columns/${ids.propertyId}`;
    console.log("API:updateColumn", { url, ids });
    await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: ids.name, type: ids.type }),
    });
  },

  async deleteColumn(ids: Ids & { propertyId: string }) {
    const url = `${base(ids)}/columns/${ids.propertyId}`;
    console.log("API:deleteColumn", { url, ids });
    await fetch(url, { method: "DELETE" });
  },
  async deleteRow(p: Ids & { rowId: string }): Promise<void> {
    const url = `${base(p)}/rows/${p.rowId}`;
    console.log("API:deleteRow", { url });
    const res = await fetch(url, { method: "DELETE" });
    if (!res.ok) throw new Error(`deleteRow ${res.status}`);
  },
};
