//list events for a timeline
export type ID = string;
function baseTimelinePath(projectId: ID, docId: ID) {
  return `/api/projects/${encodeURIComponent(
    projectId
  )}/docs/${encodeURIComponent(docId)}`;
}

async function apiFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `${init?.method ?? "GET"} ${input} -> ${res.status} ${res.statusText}${
        text ? ` — ${text}` : ""
      }`
    );
  }
  return (await res.json()) as T;
}

//GET /api/projects/:projectId/docs/:docId/collections/:collectionId/timeline/events

export async function listEvents(params: {
  projectId: ID;
  docId: ID;
  collectionId: ID;
  query?: Record<string, string | number | boolean | undefined>;
}) {
  const { projectId, docId, collectionId, query } = params;
  const q =
    query && Object.keys(query).length
      ? "?" +
        Object.entries(query)
          .filter(([, v]) => v !== undefined)
          .map(
            ([k, v]) =>
              `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
          )
          .join("&")
      : "";
  const url = `${baseTimelinePath(
    projectId,
    docId
  )}/collections/${encodeURIComponent(collectionId)}/timeline/events${q}`;
  return apiFetch<any>(url, {
    method: "GET",
    cache: "no-store",
    next: { revalidate: 0 },
  });
}
