// src/modules/board/client/board.api.ts
// Thin client helpers for the board routes.

export interface BoardBindings {
  statusPropertyId?: string | null;
  assigneePropertyId?: string | null;
  duePropertyId?: string | null;
}

export interface BoardColumnDto {
  id?: string; // task board column id
  optionId?: string; // status PropertyOption id (we'll use this as column id)
  label?: string; // display label
  value?: string; // some DTOs call it value instead of label
  position?: number | null;
}

export interface BoardCardDto {
  documentId: string;
  title?: string;
  description?: string | null;
  optionId?: string; // status option id
  columnId?: string; // board column id
  position?: number | null;
  assigneeIds?: string[];
}

export interface BoardDto {
  id: string;
  name: string;
  bindings?: BoardBindings | null;
  columns?: BoardColumnDto[];
  cards?: BoardCardDto[];
}

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Board API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

/* --------------------------- board base/meta --------------------------- */

export async function getBoard(
  projectId: string,
  docId: string,
  collectionId: string
): Promise<BoardDto> {
  const res = await fetch(
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/board`,
    { method: "GET" }
  );
  return handleJson<BoardDto>(res);
}

export async function updateBoardName(
  projectId: string,
  docId: string,
  collectionId: string,
  name: string
): Promise<BoardDto> {
  const res = await fetch(
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/board`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }
  );
  return handleJson<BoardDto>(res);
}

/* ------------------------------ columns -------------------------------- */

export interface SimpleColumn {
  id: string; // we use optionId as id
  title: string;
}

// Create a new column by adding an option to the status property.
export async function createBoardColumn(
  projectId: string,
  docId: string,
  collectionId: string,
  statusPropertyId: string,
  label: string
): Promise<SimpleColumn> {
  const res = await fetch(
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/board/property/${statusPropertyId}/options`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // If your dto uses a different key (e.g. optionLabels), adjust this:
      body: JSON.stringify({ options: [label] }),
    }
  );

  const data = await handleJson<any>(res);
  // data is a BoardProperty; we assume it has an `options` array.
  const options = data.options ?? data.columns ?? [];
  const created = options[options.length - 1] as BoardColumnDto;

  const id = (created.optionId || created.id)!;
  const title = created.label ?? created.value ?? label;

  return { id, title };
}

export async function renameBoardColumn(
  projectId: string,
  docId: string,
  collectionId: string,
  statusPropertyId: string,
  optionId: string,
  label: string
): Promise<void> {
  const res = await fetch(
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/board/property/${statusPropertyId}/options/${optionId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      // backend UpdateBoardColumnDto is { value?: string; color?: string }
      body: JSON.stringify({ value: label }),
    }
  );
  if (!res.ok) throw new Error(`Failed to rename column`);
}

export async function deleteBoardColumn(
  projectId: string,
  docId: string,
  collectionId: string,
  statusPropertyId: string,
  optionId: string
): Promise<void> {
  const res = await fetch(
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/board/property/${statusPropertyId}/options/${optionId}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error(`Failed to delete column`);
}

export async function reorderBoardColumns(
  projectId: string,
  docId: string,
  collectionId: string,
  statusPropertyId: string,
  order: string[]
): Promise<void> {
  const res = await fetch(
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/board/property/${statusPropertyId}/options/reorder`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    }
  );
  if (!res.ok) throw new Error(`Failed to reorder columns`);
}

/* -------------------------------- cards -------------------------------- */

export async function createBoardItem(
  projectId: string,
  docId: string,
  collectionId: string,
  payload: { propertyId: string; optionId: string; title?: string }
): Promise<BoardCardDto> {
  const res = await fetch(
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/board/items`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  return handleJson<BoardCardDto>(res);
}

export async function updateBoardItem(
  projectId: string,
  docId: string,
  collectionId: string,
  documentId: string,
  patch: { title?: string; optionId?: string; position?: number }
): Promise<BoardCardDto> {
  const res = await fetch(
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/board/items/${documentId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }
  );
  return handleJson<BoardCardDto>(res);
}

export async function deleteBoardItem(
  projectId: string,
  docId: string,
  collectionId: string,
  documentId: string
): Promise<void> {
  const res = await fetch(
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/board/items/${documentId}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error(`Failed to delete card`);
}

export interface BoardStatusPropertyDto {
  id: string;
  name: string;
  options: {
    id: string;
    value: string;
    color?: string | null;
    position?: number | null;
  }[];
}

/**
 * Create a new STATUS-type property for this board and its collection,
 * with some initial options (we’ll use one: "Untitled Column").
 */

export async function createStatusPropertyForBoard(
  projectId: string,
  docId: string,
  collectionId: string,
  opts: { name: string; options: string[] } // <-- change shape
): Promise<BoardStatusPropertyDto> {
  const res = await fetch(
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/board/property`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: opts.name,
        options: opts.options, // <-- backend expects this key
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create status property: ${res.status} ${text}`);
  }

  return (await res.json()) as BoardStatusPropertyDto;
}

/**
 * Bind a given status property to this board (so board.bindings.statusPropertyId is set).
 */
export async function updateBoardStatusBinding(
  projectId: string,
  docId: string,
  collectionId: string,
  statusPropertyId: string | null
): Promise<void> {
  const res = await fetch(
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/board/status-binding`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusPropertyId }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update status binding: ${res.status} ${text}`);
  }
}
export interface StatusPropertyOptionDto {
  id: string;
  value: string;
  color?: string | null;
  position?: number | null;
}

export interface StatusPropertyDto {
  id: string;
  name: string;
  options: StatusPropertyOptionDto[];
}

export interface BoardStatusPropertiesResponse {
  currentPropertyId: string | null;
  properties: StatusPropertyDto[];
}

export async function getBoardStatusProperties(
  projectId: string,
  docId: string,
  collectionId: string
): Promise<BoardStatusPropertiesResponse> {
  const res = await fetch(
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/board/status-properties`,
    { method: "GET" }
  );
  return handleJson<BoardStatusPropertiesResponse>(res);
}
