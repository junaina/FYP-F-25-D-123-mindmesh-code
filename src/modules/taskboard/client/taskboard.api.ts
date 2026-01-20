// src/modules/taskboard/client/taskboard.api.ts
// FE-first mock API (localStorage). Matches the functions used in TaskboardKanban.tsx.

export type StatusPropertyOptionDto = {
  id: string;
  value: string;
  color?: string | null;
  position?: number | null;
};

export type StatusPropertyDto = {
  id: string;
  name: string;
  options: StatusPropertyOptionDto[];
};

export interface TaskboardBindings {
  statusPropertyId?: string | null;
}

export interface TaskboardColumnDto {
  id?: string;
  optionId?: string;
  label?: string;
  value?: string;
  position?: number | null;
}

export interface TaskboardCardDto {
  id: string; // we use this as documentId in UI
  documentId?: string;
  title?: string;
  description?: string | null;
  optionId?: string; // status option id
  columnId?: string; // status option id (UI expects columnId sometimes)
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

/* --------------------------------------------------------------------- */

type Store = {
  board: TaskboardDto;
  statusProperties: StatusPropertyDto[];
};

const lsKey = (projectId: string) => `mindmesh:taskboard:${projectId}`;

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id_${Math.random().toString(36).slice(2)}_${Date.now()}`;

function loadStore(projectId: string): Store {
  if (typeof window === "undefined") {
    // Server render safety; UI calls these only on client anyway.
    return seedStore(projectId);
  }

  const raw = window.localStorage.getItem(lsKey(projectId));
  if (!raw) {
    const seeded = seedStore(projectId);
    window.localStorage.setItem(lsKey(projectId), JSON.stringify(seeded));
    return seeded;
  }

  try {
    return JSON.parse(raw) as Store;
  } catch {
    const seeded = seedStore(projectId);
    window.localStorage.setItem(lsKey(projectId), JSON.stringify(seeded));
    return seeded;
  }
}

function saveStore(projectId: string, store: Store) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(lsKey(projectId), JSON.stringify(store));
}

function seedStore(projectId: string): Store {
  const statusPropId = uid();
  const options: StatusPropertyOptionDto[] = [
    { id: uid(), value: "Untitled Column", position: 1 },
  ];

  const statusProp: StatusPropertyDto = {
    id: statusPropId,
    name: "status",
    options,
  };

  const boardId = uid();

  const board: TaskboardDto = {
    id: boardId,
    name: "Untitled Board",
    bindings: { statusPropertyId: statusPropId },
    columns: options.map((o) => ({
      optionId: o.id,
      label: o.value,
      position: o.position ?? null,
    })),
    cards: [],
  };

  return {
    board,
    statusProperties: [statusProp],
  };
}

function rebuildBoardColumnsFromBinding(store: Store) {
  const bound = store.board.bindings?.statusPropertyId ?? null;
  if (!bound) {
    store.board.columns = [];
    return;
  }

  const prop = store.statusProperties.find((p) => p.id === bound);
  if (!prop) {
    store.board.columns = [];
    return;
  }

  const sorted = [...prop.options].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );

  store.board.columns = sorted.map((o) => ({
    optionId: o.id,
    label: o.value,
    value: o.value,
    position: o.position ?? null,
  }));
}

/* ------------------------------ Board base ------------------------------ */

export async function getTaskboard(projectId: string): Promise<TaskboardDto> {
  const store = loadStore(projectId);
  rebuildBoardColumnsFromBinding(store);
  saveStore(projectId, store);
  return structuredClone(store.board);
}

export async function updateTaskboardName(
  projectId: string,
  name: string,
): Promise<TaskboardDto> {
  const store = loadStore(projectId);
  store.board.name = name;
  saveStore(projectId, store);
  return structuredClone(store.board);
}

/* -------------------------- Status property list ------------------------- */

export async function getTaskboardStatusProperties(projectId: string): Promise<{
  properties: StatusPropertyDto[];
  currentPropertyId: string | null;
}> {
  const store = loadStore(projectId);
  return {
    properties: structuredClone(store.statusProperties),
    currentPropertyId: store.board.bindings?.statusPropertyId ?? null,
  };
}

/**
 * Create a status property (and its options). DOES NOT auto-bind; your UI binds via updateTaskboardStatusBinding.
 */
export async function createStatusPropertyForTaskboard(
  projectId: string,
  opts: { name: string; options: string[] },
): Promise<StatusPropertyDto> {
  const store = loadStore(projectId);

  const prop: StatusPropertyDto = {
    id: uid(),
    name: opts.name || "status",
    options: (opts.options ?? []).map((label, i) => ({
      id: uid(),
      value: label,
      position: i + 1,
    })),
  };

  // Ensure at least 1 option
  if (prop.options.length === 0) {
    prop.options.push({ id: uid(), value: "Untitled Column", position: 1 });
  }

  store.statusProperties.push(prop);
  saveStore(projectId, store);

  return structuredClone(prop);
}

export async function updateTaskboardStatusBinding(
  projectId: string,
  statusPropertyId: string,
): Promise<void> {
  const store = loadStore(projectId);
  store.board.bindings = store.board.bindings ?? {};
  store.board.bindings.statusPropertyId = statusPropertyId;

  rebuildBoardColumnsFromBinding(store);
  saveStore(projectId, store);
}

/* ------------------------------ Columns --------------------------------- */

export async function createTaskboardColumn(
  projectId: string,
  statusPropertyId: string,
  label: string,
): Promise<{ id: string; title: string }> {
  const store = loadStore(projectId);

  const prop = store.statusProperties.find((p) => p.id === statusPropertyId);
  if (!prop) throw new Error("status property not found");

  const optionId = uid();
  const position =
    (prop.options.reduce((m, o) => Math.max(m, o.position ?? 0), 0) || 0) + 1;

  prop.options.push({ id: optionId, value: label, position });

  rebuildBoardColumnsFromBinding(store);
  saveStore(projectId, store);

  return { id: optionId, title: label };
}

export async function renameTaskboardColumn(
  projectId: string,
  statusPropertyId: string,
  optionId: string,
  label: string,
): Promise<void> {
  const store = loadStore(projectId);

  const prop = store.statusProperties.find((p) => p.id === statusPropertyId);
  if (!prop) throw new Error("status property not found");

  const opt = prop.options.find((o) => o.id === optionId);
  if (!opt) throw new Error("option not found");

  opt.value = label;

  rebuildBoardColumnsFromBinding(store);
  saveStore(projectId, store);
}

export async function deleteTaskboardColumn(
  projectId: string,
  statusPropertyId: string,
  optionId: string,
): Promise<void> {
  const store = loadStore(projectId);

  const prop = store.statusProperties.find((p) => p.id === statusPropertyId);
  if (!prop) throw new Error("status property not found");

  prop.options = prop.options.filter((o) => o.id !== optionId);

  // remove tasks in that column
  store.board.cards = (store.board.cards ?? []).filter(
    (c) => (c.columnId ?? c.optionId) !== optionId,
  );

  rebuildBoardColumnsFromBinding(store);
  saveStore(projectId, store);
}

export async function reorderTaskboardColumns(
  projectId: string,
  statusPropertyId: string,
  order: string[],
): Promise<void> {
  const store = loadStore(projectId);

  const prop = store.statusProperties.find((p) => p.id === statusPropertyId);
  if (!prop) throw new Error("status property not found");

  const byId = new Map(prop.options.map((o) => [o.id, o]));
  const next: StatusPropertyOptionDto[] = [];
  order.forEach((id, idx) => {
    const o = byId.get(id);
    if (o) next.push({ ...o, position: idx + 1 });
  });

  // keep any stray options at end
  prop.options
    .filter((o) => !order.includes(o.id))
    .forEach((o) => next.push({ ...o, position: (next.length ?? 0) + 1 }));

  prop.options = next;

  rebuildBoardColumnsFromBinding(store);
  saveStore(projectId, store);
}

/* -------------------------------- Cards --------------------------------- */

export async function createTaskboardItem(
  projectId: string,
  payload: { propertyId: string; optionId: string; title?: string },
): Promise<TaskboardCardDto> {
  const store = loadStore(projectId);

  // id is documentId for now (FE-first). Later: create real document + attach properties.
  const id = uid();

  const cards = store.board.cards ?? [];
  const card: TaskboardCardDto = {
    id,
    title: payload.title ?? "Untitled Task",
    description: "",
    columnId: payload.optionId,
    optionId: payload.optionId,
    position: 0,
    assigneeIds: [],
  };

  store.board.cards = [card, ...cards];
  saveStore(projectId, store);

  return structuredClone(card);
}

export async function updateTaskboardItem(
  projectId: string,
  documentId: string,
  patch: {
    title?: string;
    description?: string;
    optionId?: string;
    position?: number;
  },
): Promise<TaskboardCardDto> {
  const store = loadStore(projectId);

  const cards = store.board.cards ?? [];
  const idx = cards.findIndex((c) => (c.id ?? c.documentId) === documentId);
  if (idx === -1) throw new Error("card not found");

  const cur = cards[idx];
  const next: TaskboardCardDto = {
    ...cur,
    title: patch.title ?? cur.title,
    description:
      patch.description !== undefined ? patch.description : cur.description,
    columnId: patch.optionId ?? cur.columnId,
    optionId: patch.optionId ?? cur.optionId,
    position: patch.position ?? cur.position,
  };

  cards[idx] = next;
  store.board.cards = cards;

  saveStore(projectId, store);
  return structuredClone(next);
}

export async function deleteTaskboardItem(
  projectId: string,
  documentId: string,
): Promise<void> {
  const store = loadStore(projectId);
  store.board.cards = (store.board.cards ?? []).filter(
    (c) => (c.id ?? c.documentId) !== documentId,
  );
  saveStore(projectId, store);
}
