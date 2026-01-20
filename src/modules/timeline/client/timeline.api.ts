import type {
  TimelinePropertyDef,
  GetTimelinePropertiesResponse,
} from "@/modules/timeline/dto/timeline.dto";
export type PropertyOptionsMap = Record<string, { id: string; name: string }[]>;

export type ID = string;
function baseTimelinePath(projectId: ID, docId: ID) {
  return `/api/projects/${encodeURIComponent(
    projectId
  )}/docs/${encodeURIComponent(docId)}`;
}
export async function getTimelineProperties(params: {
  projectId?: string;
  docId?: string;
  collectionId?: string;
}) {
  const { projectId, docId, collectionId } = params;

  const res = await fetch(
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/timeline/properties`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Failed to load property defs");
  const json = await res.json();
  return json as {
    properties: { id: string; name: string; kind: string }[];
    visiblePropertyIds: string[];
    optionsByPropertyId?: Record<
      string,
      { id: string; name: string; color?: string | null }[]
    >;
  };
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
// PUT /properties
export async function setTimelineVisibleProperties(
  projectId: string,
  docId: string,
  collectionId: string,
  visiblePropertyIds: string[]
): Promise<GetTimelinePropertiesResponse> {
  const res = await fetch(
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/timeline/properties`,
    {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visiblePropertyIds }),
    }
  );
  if (!res.ok) throw new Error("Failed to save visible properties");
  return (await res.json()) as GetTimelinePropertiesResponse;
}

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

//delete event
export async function deleteEvent(params: {
  projectId: string;
  docId: string;
  collectionId: string;
  documentId: string;
}) {
  const { projectId, docId, collectionId, documentId } = params;
  const url = `/api/projects/${encodeURIComponent(
    projectId
  )}/docs/${encodeURIComponent(docId)}/collections/${encodeURIComponent(
    collectionId
  )}/timeline/events/${encodeURIComponent(documentId)}`;

  const res = await fetch(url, {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Failed to delete event");
  }
  return;
}
export async function createTimelineEvent(
  projectId: string,
  docId: string,
  collectionId: string,
  body: { title?: string; start: string; end: string }
) {
  const res = await fetch(
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/timeline/events`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new Error("Failed to create timeline event");
  return (await res.json()) as { id: string };
}
// Create a timeline collection under a doc
export async function createTimeline(params: {
  projectId: string;
  docId: string;
  name?: string;
}) {
  const { projectId, docId, name } = params;
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/docs/${encodeURIComponent(
      docId
    )}/collections/timeline`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(name ? { name } : {}),
    }
  );
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Failed to create timeline");
  }
  return (await res.json()) as { id: string };
}
