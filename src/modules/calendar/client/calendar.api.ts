// src/modules/calendar/client/calendar.api.ts
export async function fetchInstances(
  projectId: string,
  docId: string,
  collectionId: string,
  fromISO: string,
  toISO: string
) {
  const r = await fetch(
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/calendar?from=${fromISO}&to=${toISO}`
  );
  if (!r.ok) throw new Error("calendar fetch failed");
  return r.json();
}

export async function fetchProperties(
  projectId: string,
  docId: string,
  collectionId: string
) {
  const r = await fetch(
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/calendar/properties`
  );
  if (!r.ok) throw new Error("properties fetch failed");
  return r.json();
}

export async function fetchSettings(
  projectId: string,
  docId: string,
  collectionId: string
) {
  const r = await fetch(
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/calendar/settings`
  );
  if (!r.ok) throw new Error("settings fetch failed");
  return r.json();
}

// Create (single or range)
export async function createEvent(
  projectId: string,
  docId: string,
  collectionId: string,
  body: {
    title?: string;
    mode?: "single" | "range";
    // When mode = "single"
    date?: string; // "YYYY-MM-DD"
    // When mode = "range"
    start?: string; // "YYYY-MM-DD"
    end?: string; // "YYYY-MM-DD"
    inheritAllCalendarProps?: boolean;
  }
): Promise<{ documentId: string }> {
  const r = await fetch(
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/calendar/events`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!r.ok) throw new Error(`create event failed (${r.status})`);
  return r.json();
}

// Move (drag) — shift by N days
export async function moveEvent(
  projectId: string,
  docId: string,
  collectionId: string,
  documentId: string,
  deltaDays: number
): Promise<void> {
  const r = await fetch(
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/calendar/events/${documentId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "move", deltaDays }),
    }
  );
  if (!r.ok) throw new Error(`move event failed (${r.status})`);
}

// Resize one edge to a specific date
export async function resizeEvent(
  projectId: string,
  docId: string,
  collectionId: string,
  documentId: string,
  edge: "start" | "end",
  to: string // "YYYY-MM-DD"
): Promise<void> {
  const r = await fetch(
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/calendar/events/${documentId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "resize", edge, to }),
    }
  );
  if (!r.ok) throw new Error(`resize event failed (${r.status})`);
}

// Rename (title only)
export async function renameEvent(
  projectId: string,
  docId: string,
  collectionId: string,
  documentId: string,
  title: string
): Promise<void> {
  const r = await fetch(
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/calendar/events/${documentId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "rename", title }),
    }
  );
  if (!r.ok) throw new Error(`rename event failed (${r.status})`);
}

// Delete the underlying Document globally (no unlink mode)
export async function deleteEvent(
  projectId: string,
  docId: string,
  collectionId: string,
  documentId: string
): Promise<void> {
  const r = await fetch(
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/calendar/events/${documentId}`,
    { method: "DELETE" }
  );
  if (!r.ok) throw new Error(`delete event failed (${r.status})`);
}

// ---------------------------------------------------------
// Settings (PUT) — persist visiblePropertyIds
// ---------------------------------------------------------
export async function putSettings(
  projectId: string,
  docId: string,
  collectionId: string,
  visiblePropertyIds: string[]
): Promise<{ visiblePropertyIds: string[] }> {
  const r = await fetch(
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/calendar/settings`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visiblePropertyIds }),
    }
  );
  if (!r.ok) throw new Error(`settings update failed (${r.status})`);
  return r.json();
}
