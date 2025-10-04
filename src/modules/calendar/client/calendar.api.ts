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
