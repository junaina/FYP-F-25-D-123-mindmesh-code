// src/modules/calendar/services/calendar.service.ts
import {
  DEFAULT_BINDINGS,
  CalendarInstance,
} from "@/modules/calendar/domain/models";
import {
  repoGetDatePropIds,
  repoGetEventDocHeaders,
  repoGetVisiblePropertyIds,
  repoGetDocumentPropertyValues,
  repoGetUsedPropertyDefsForCollection,
  repoGetPropertyTypes,
} from "../repo/calendar.repo";

/** Convert a raw value row into your doc DTO-like { type, value } based on property kind. */
function toPropertyValueDto(
  row: {
    valueString: string | null;
    valueNumber: number | null;
    valueBool: boolean | null;
    valueDate: Date | null;
    valueJson: unknown | null;
    optionId: string | null;
  },
  kind: string
) {
  switch (kind) {
    case "text":
    case "email":
    case "url":
    case "phone":
      return { type: kind, value: row.valueString ?? "" };
    case "number":
      return { type: kind, value: row.valueNumber };
    case "checkbox":
      return { type: kind, value: Boolean(row.valueBool) };
    case "date":
      return {
        type: "date_time",
        value: row.valueDate ? row.valueDate.toISOString() : null,
      };
    case "file":
      return { type: kind, value: row.valueJson ?? [] };
    case "person":
      return { type: kind, value: row.valueJson ?? null };
    case "multi_select":
      return { type: kind, value: (row.valueJson as string[] | null) ?? [] };
    case "select":
    case "status":
      return { type: kind, value: row.optionId };
    default:
      return { type: kind, value: row.valueJson ?? row.valueString ?? null };
  }
}

/** GET /calendar?from&to */
export async function listInstances(
  projectId: string,
  collectionId: string,
  fromISO: string,
  toISO: string,
  // pass docId for repo scoping
  docId?: string
): Promise<{ instances: CalendarInstance[] }> {
  const from = new Date(fromISO);
  const to = new Date(toISO);

  // 1) event docs (doc-scoped)
  const docs = await repoGetEventDocHeaders(projectId, docId!, collectionId);
  const docIds = docs.map((d) => d.id);
  if (!docIds.length) return { instances: [] };

  // 2) date prop ids (project-scoped)
  const { singleId, startId, endId } = await repoGetDatePropIds(
    projectId,
    DEFAULT_BINDINGS
  );

  // 3) visible prop ids (doc-scoped)
  const visiblePropIds = await repoGetVisiblePropertyIds(
    projectId,
    docId!,
    collectionId
  );

  // 4) types for visible props (to cast values)
  const typeByPropId = await repoGetPropertyTypes(visiblePropIds);

  // 5) load value rows for date + visible props
  const wantedPropIds = [singleId, startId, endId, ...visiblePropIds].filter(
    Boolean
  ) as string[];
  const values = await repoGetDocumentPropertyValues(docIds, wantedPropIds);

  // 6) index by doc
  const byDoc = new Map<string, typeof values>();
  for (const v of values) {
    const arr = byDoc.get(v.documentId);
    if (arr) arr.push(v);
    else byDoc.set(v.documentId, [v]);
  }

  // 7) shape instances
  const out: CalendarInstance[] = [];
  for (const d of docs) {
    const arr = byDoc.get(d.id) ?? [];
    const find = (pid?: string) =>
      pid ? arr.find((v) => v.propertyId === pid) : undefined;

    const sVal = find(startId)?.valueDate;
    const eVal = find(endId)?.valueDate;
    const dVal = find(singleId)?.valueDate;

    const start = sVal ?? dVal ?? null;
    const end = eVal ?? dVal ?? null;
    if (!start || !end) continue;
    if (end < from || start > to) continue;

    const propBag: Record<string, unknown> = {};
    for (const v of arr) {
      if (!visiblePropIds.includes(v.propertyId)) continue;
      const kind = typeByPropId.get(v.propertyId);
      if (!kind) continue;
      propBag[v.propertyId] = toPropertyValueDto(v, kind);
    }

    out.push({
      instanceId: `${d.id}:${(start as Date).toISOString()}`,
      documentId: d.id,
      title: d.title || "untitled",
      start: (start as Date).toISOString(),
      end: (end as Date).toISOString(),
      isRange: Boolean(sVal && eVal),
      properties: propBag,
      createdAt: (d.createdAt as any)?.toISOString?.() ?? (d.createdAt as any),
      updatedAt: (d.updatedAt as any)?.toISOString?.() ?? (d.updatedAt as any),
    });
  }

  // deterministic order
  out.sort(
    (a, b) =>
      a.start.localeCompare(b.start) ||
      new Date(b.end).getTime() -
        new Date(b.start).getTime() -
        (new Date(a.end).getTime() - new Date(a.start).getTime()) ||
      (a.createdAt ?? "").localeCompare(b.createdAt ?? "") ||
      a.documentId.localeCompare(b.documentId)
  );

  return { instances: out };
}

/** GET /calendar/properties */
export async function listProperties(
  projectId: string,
  docId: string,
  collectionId: string
) {
  const defs = await repoGetUsedPropertyDefsForCollection(
    projectId,
    docId,
    collectionId
  );
  const mapKind = (t: string) => (t === "date" ? "date_time" : t);
  return {
    properties: defs.map((d) => ({
      id: d.id,
      name: d.name,
      kind: mapKind(d.type),
    })),
  };
}

/** GET /calendar/settings */
export async function getSettings(
  projectId: string,
  docId: string,
  collectionId: string
) {
  const ids = await repoGetVisiblePropertyIds(projectId, docId, collectionId);
  return { visiblePropertyIds: ids };
}
