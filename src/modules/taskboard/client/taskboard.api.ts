// src/modules/taskboard/client/taskboard.api.ts
// Thin client helpers for the taskboard routes.

export interface TaskboardBindings {
  statusPropertyId?: string | null;
  assigneePropertyId?: string | null;
  duePropertyId?: string | null;
}

export interface TaskboardColumnDto {
  id?: string;
  optionId?: string;
  label?: string;
  value?: string;
  title?: string;
  name?: string;
  position?: number | null;
}

export interface TaskboardCardDto {
  id?: string;
  documentId?: string;
  title?: string;
  description?: string | null;
  optionId?: string;
  columnId?: string;
  columnOptionId?: string;
  position?: number | null;
  assigneeIds?: string[];
}

export interface TaskboardDto {
  id: string;
  name: string;
  bindings?: TaskboardBindings | null;
  columns?: TaskboardColumnDto[];
  cards?: TaskboardCardDto[];
}

export type StatusPropertyDto = {
  id: string;
  name: string;
  options: {
    id: string;
    value: string;
    color?: string | null;
    position?: number | null;
  }[];
};

export type TaskboardStatusPropertiesResponseDto = {
  properties: StatusPropertyDto[];
  currentPropertyId: string | null;
};

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Taskboard API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// IMPORTANT: your routes are /taskboard (NOT /task-board)
const SEGMENT = "taskboard";

/* --------------------------- slice 1: GETs --------------------------- */

export async function getTaskboard(projectId: string): Promise<TaskboardDto> {
  const res = await fetch(`/api/projects/${projectId}/${SEGMENT}`, {
    method: "GET",
    credentials: "include",
  });
  return handleJson<TaskboardDto>(res);
}

export async function getTaskboardStatusProperties(
  projectId: string,
): Promise<TaskboardStatusPropertiesResponseDto> {
  const res = await fetch(
    `/api/projects/${projectId}/${SEGMENT}/status-properties`,
    { method: "GET", credentials: "include" },
  );
  return handleJson<TaskboardStatusPropertiesResponseDto>(res);
}

/* ----------------------- exported stubs for now ----------------------- */
/* (UI imports these; we’ll implement them slice-by-slice later.) */

function notImplemented(name: string): never {
  throw new Error(`${name} not implemented yet (next slice)`);
}

export async function updateTaskboardName(
  _projectId: string,
  _name: string,
): Promise<TaskboardDto> {
  notImplemented("updateTaskboardName");
}

export async function deleteTaskboardColumn(
  projectId: string,
  statusPropertyId: string,
  optionId: string,
): Promise<void> {
  const res = await fetch(
    `/api/projects/${projectId}/${SEGMENT}/property/${statusPropertyId}/options/${optionId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );
  await handleJson<{ ok: true }>(res);
}

export async function reorderTaskboardColumns(
  projectId: string,
  statusPropertyId: string,
  order: string[],
): Promise<void> {
  const res = await fetch(
    `/api/projects/${projectId}/${SEGMENT}/property/${statusPropertyId}/options/reorder`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    },
  );
  await handleJson<{ ok: true }>(res);
}

export async function createTaskboardItem(
  projectId: string,
  payload: { propertyId: string; optionId: string; title?: string },
): Promise<TaskboardCardDto> {
  const res = await fetch(`/api/projects/${projectId}/${SEGMENT}/items`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      propertyId: payload.propertyId,
      optionId: payload.optionId,
      title: payload.title ?? "Untitled Task",
    }),
  });
  return handleJson<TaskboardCardDto>(res);
}

export async function updateTaskboardItem(
  projectId: string,
  documentId: string,
  patch: {
    title?: string;
    description?: string;
    optionId?: string;
    position?: number;
    assigneeIds?: string[];
  },
): Promise<TaskboardCardDto> {
  const res = await fetch(
    `/api/projects/${projectId}/${SEGMENT}/items/${documentId}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    },
  );
  return handleJson<TaskboardCardDto>(res);
}

export async function deleteTaskboardItem(
  projectId: string,
  documentId: string,
): Promise<void> {
  const res = await fetch(
    `/api/projects/${projectId}/${SEGMENT}/items/${documentId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );
  await handleJson(res);
}

export async function createStatusPropertyForTaskboard(
  _projectId: string,
  _opts: { name: string; options: string[] },
): Promise<StatusPropertyDto> {
  notImplemented("createStatusPropertyForTaskboard");
}

export async function updateTaskboardStatusBinding(
  projectId: string,
  statusPropertyId: string,
): Promise<{ ok: true }> {
  const res = await fetch(
    `/api/projects/${projectId}/taskboard/status-binding`,
    {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusPropertyId }),
    },
  );

  return handleJson<{ ok: true }>(res);
}

export async function createTaskboardColumn(
  projectId: string,
  statusPropertyId: string,
  label: string,
): Promise<{ id: string; title: string }> {
  const res = await fetch(
    `/api/projects/${projectId}/${SEGMENT}/property/${statusPropertyId}/options`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    },
  );
  return handleJson<{ id: string; title: string }>(res);
}
export async function renameTaskboardColumn(
  projectId: string,
  statusPropertyId: string,
  optionId: string,
  label: string,
): Promise<void> {
  const res = await fetch(
    `/api/projects/${projectId}/${SEGMENT}/property/${statusPropertyId}/options/${optionId}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    },
  );
  await handleJson<{ ok: true }>(res);
}
