// Client <-> API helpers + shared DTO used by ClientDoc

export type ApiPropOption = {
  id: string;
  value: string;
  color?: string | null;
};

export type ApiProp = {
  type: string; // ui mapper normalizes this further
  value: unknown;
  options?: ApiPropOption[];
};

export type DocHeaderAPI = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  properties: Record<string, ApiProp>;
};

// ---- HTTP helpers

export async function fetchDocHeader(id: string): Promise<DocHeaderAPI> {
  const res = await fetch(`/api/docs/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch doc");
  return res.json();
}

export type PatchPayload = Partial<{
  title: string;
  description: string | null;
  // Properties to set (by name). Any *missing* names are treated as deletions.
  properties: Record<string, unknown>;
}>;

export async function patchDocHeader(id: string, payload: PatchPayload) {
  const res = await fetch(`/api/docs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save");
  return res.json();
}
