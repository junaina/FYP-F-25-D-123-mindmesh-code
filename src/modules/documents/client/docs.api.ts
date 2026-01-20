import {
  PatchDocHeaderDto,
  PatchPropertyDefDto,
  PropertyDefinitionDto,
  SavePropertyOptionsDto,
  PropertyOptionDto,
  CreatePropertyBodyDto,
  PropertyValueDto,
  DocHeaderDto,
} from "@/modules/documents/dto/doc.dto";

export async function createProjectDocument(projectId: string, title?: string) {
  const res = await fetch(`/api/projects/${projectId}/docs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title }),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to create document");
  return res.json() as Promise<{ id: string }>;
}

export async function fetchDocHeader(projectId: string, docId: string) {
  console.log(
    "fetchDocHeader url:",
    `/api/projects/${projectId}/docs/${docId}`
  );

  const res = await fetch(`/api/projects/${projectId}/docs/${docId}`, {
    method: "GET",
    cache: "no-store",
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error("Failed to fetch doc");
  const data = (await res.json()) as DocHeaderDto;
  return data;
}

export async function patchDocHeader(
  projectId: string,
  docId: string,
  patch: PatchDocHeaderDto
) {
  const res = await fetch(`/api/projects/${projectId}/docs/${docId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to patch doc header (${res.status}): ${text || res.statusText}`
    );
  }
}
export async function createProperty(
  projectId: string,
  docId: string,
  body: CreatePropertyBodyDto
): Promise<PropertyDefinitionDto> {
  const res = await fetch(
    `/api/projects/${projectId}/docs/${docId}/properties`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to create property (${res.status}): ${text || res.statusText}`
    );
  }
  return res.json() as Promise<PropertyDefinitionDto>;
}

export async function savePropertyOptions(
  projectId: string,
  docId: string,
  propertyId: string,
  options: SavePropertyOptionsDto["options"]
): Promise<{ options: PropertyOptionDto[] }> {
  const res = await fetch(
    `/api/projects/${projectId}/docs/${docId}/properties/${propertyId}/options`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ options }),
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to save property options (${res.status}): ${
        text || res.statusText
      }`
    );
  }
  return res.json();
}

export async function patchPropertyDef(
  projectId: string,
  docId: string,
  propertyId: string,
  patch: PatchPropertyDefDto
): Promise<PropertyDefinitionDto> {
  const res = await fetch(
    `/api/projects/${projectId}/docs/${docId}/properties/${propertyId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to patch property (${res.status}): ${text || res.statusText}`
    );
  }
  return res.json();
}
export async function patchPropertyValue(
  projectId: string,
  docId: string,
  propertyId: string,
  value: PropertyValueDto
) {
  const res = await fetch(
    `/api/projects/${projectId}/docs/${docId}/properties/${propertyId}/value`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Failed to save property value");
  }
  return (await res.json()) as { ok: true };
}

export async function deleteProperty(
  projectId: string,
  docId: string,
  propertyId: string
): Promise<void> {
  const res = await fetch(
    `/api/projects/${projectId}/docs/${docId}/properties/${propertyId}`,
    { method: "DELETE" }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to delete property (${res.status}): ${text || res.statusText}`
    );
  }
}
export async function readPropertyOptions(
  projectId: string,
  docId: string,
  propertyId: string
): Promise<{
  options: {
    id: string;
    value: string;
    color: string | null;
    position: number | null;
  }[];
}> {
  const res = await fetch(
    `/api/projects/${projectId}/docs/${docId}/properties/${propertyId}/options`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Failed to read property options (${res.status}): ${
        text || res.statusText
      }`
    );
  }
  return res.json();
}
export async function readDocProperties(
  projectId: string,
  docId: string
): Promise<{
  properties: (PropertyDefinitionDto & { value?: PropertyValueDto })[];
}> {
  const res = await fetch(
    `/api/projects/${projectId}/docs/${docId}/properties`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Failed to fetch properties with values");
  return res.json();
}

export async function fetchDocContent(projectId: string, docId: string) {
  if (!projectId || !docId) {
    throw new Error(
      `fetchDocContent called without IDs: {projectId:${projectId}, docId:${docId}}`
    );
  }
  const url = `/api/projects/${encodeURIComponent(
    projectId
  )}/docs/${encodeURIComponent(docId)}/content`;

  const r = await fetch(url, {
    cache: "no-store",
    method: "GET",
    credentials: "include",
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    const err: any = new Error(
      `GET ${url} failed ${r.status} ${r.statusText} — ${text}`
    );
    err.status = r.status;
    throw err;
  }
  return r.json() as Promise<{ id: string; content: any; updatedAt: string }>;
}
export async function patchDocContent(
  projectId: string,
  docId: string,
  body: { content: any; lastKnownUpdatedAt?: string }
) {
  if (!projectId || !docId) {
    throw new Error(
      `patchDocContent called without IDs: {projectId:${projectId}, docId:${docId}}`
    );
  }
  const url = `/api/projects/${encodeURIComponent(
    projectId
  )}/docs/${encodeURIComponent(docId)}/content`;

  const r = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    const err: any = new Error(
      `PATCH ${url} failed ${r.status} ${r.statusText} — ${text}`
    );
    err.status = r.status;
    throw err;
  }
  return r.json() as Promise<{ updatedAt: string }>;
}
