// add types
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
    optionsByPropertyId?: Record<string, { id: string; name: string }[]>;
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
    `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/properties`,
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
