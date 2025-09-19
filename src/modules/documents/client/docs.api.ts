// src/modules/documents/client/docs.api.ts
import type {
  PatchDocHeaderDto,
  PatchPropertyDefDto,
  PropertyDefinitionDto,
  SavePropertyOptionsDto,
  PropertyOptionDto,
} from "@/modules/documents/dto/doc.dto";

/** GET /api/projects/:projectId/docs/:docId */
export async function fetchDocHeader(projectId: string, docId: string) {
  const res = await fetch(`/api/projects/${projectId}/docs/${docId}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch doc");
  return res.json();
}

/** PATCH /api/projects/:projectId/docs/:docId */
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

/** PUT /api/projects/:projectId/docs/:docId/properties/:propertyId/options */
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

// PATCH /api/projects/:projectId/docs/:docId/properties/:propertyId
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
