// Light client for table-view endpoints that match your routes
// Uses same fetch style as your docs client (cache: no-store)

export type PropertyType =
  | "text"
  | "number"
  | "email"
  | "url"
  | "checkbox"
  | "select"
  | "multi_select"
  | "status"
  | "person"
  | "file"
  | "date_time";

export type PropertyValueDto =
  | { type: "text"; value: string | null }
  | { type: "number"; value: number | null }
  | { type: "email"; value: string | null }
  | { type: "url"; value: string | null }
  | { type: "checkbox"; value: boolean | null }
  | { type: "select"; value: string | null }      // optionId
  | { type: "multi_select"; value: string[] }     // optionIds
  | { type: "status"; value: string | null }      // optionId
  | { type: "person"; value: string | null }      // userId
  | { type: "file"; value: any }
  | { type: "date_time"; value: string | null };

export type PropertyDefinition = {
  id: string;
  name: string;
  type: PropertyType;
  // optional; present for option-based types when backend sends them
  options?: { id: string; value: string; color?: string | null; position?: number }[];
};

export async function fetchCollection(
  projectId: string,
  collectionId: string
): Promise<{ id: string; name: string }> {
  const res = await fetch(`/api/projects/${projectId}/collections/${collectionId}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch collection ${collectionId}`);
  return res.json();
}

export async function patchCollection(
  projectId: string,
  collectionId: string,
  body: { name?: string }
) {
  const res = await fetch(`/api/projects/${projectId}/collections/${collectionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to patch collection: ${await res.text()}`);
}

export type TableRowsResponse = {
  columns: { id: string; name: string; type: PropertyType; options?: PropertyDefinition["options"] }[];
  rows: Array<{
    id: string;           // wiki doc id
    title: string;
    properties: Record<string, PropertyValueDto | undefined>; // key: propertyId
  }>;
};

export async function fetchRows(
  projectId: string,
  docId: string,
  collectionId: string
): Promise<TableRowsResponse> {
  const res = await fetch(
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/rows`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Failed to fetch rows");
  return res.json();
}

export async function createRow(
  projectId: string,
  docId: string,
  collectionId: string,
  body: { title?: string; properties?: Record<string, PropertyValueDto> } = {}
) {
  const res = await fetch(
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/rows`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: body.title ?? "New page", properties: body.properties }),
    }
  );
  if (!res.ok) throw new Error(`Failed to create row: ${await res.text()}`);
  return res.json() as Promise<{ id: string; title: string }>;
}

export async function addPropertyViaColumn(
  projectId: string,
  docId: string,
  collectionId: string,
  body: { name: string; type: PropertyType }
): Promise<PropertyDefinition> {
  const res = await fetch(
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/properties`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new Error(`Failed to add property: ${await res.text()}`);
  return res.json();
}

export async function patchPropertyDef(
  projectId: string,
  docId: string,
  collectionId: string,
  propertyId: string,
  patch: { name?: string; type?: PropertyType; dropOptionsOnTypeChange?: boolean }
): Promise<PropertyDefinition> {
  const res = await fetch(
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/properties/${propertyId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }
  );
  if (!res.ok) throw new Error(`Failed to patch property: ${await res.text()}`);
  return res.json();
}

export async function patchRow(
  projectId: string,
  docId: string,
  collectionId: string,
  rowId: string,
  patch: { title?: string; description?: string | null; properties?: Record<string, PropertyValueDto> }
) {
  const res = await fetch(
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/rows/${rowId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }
  );
  if (!res.ok) throw new Error(`Failed to patch row: ${await res.text()}`);
  return res.json();
}
