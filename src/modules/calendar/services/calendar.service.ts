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
import {
  repoCreateDocument,
  repoLinkToCollection,
  repoEnsureDatePropDef,
  repoEnsureDocProperty,
  repoGetDocumentProjectId,
  repoUpsertDateValue,
  repoGetCollectionPropDefs,
  repoReadDocDateValues,
  repoUpdateDocumentTitle,
  repoUnlinkFromCollection,
  repoDeleteDocument,
} from "../repo/calendar.repo";
import {
  CAL_BINDINGS,
  parseYmdToUTC,
  addDaysUTC,
} from "../lib/calendarBindings";
import { DocumentService } from "@/modules/documents/services/document.service";
import { repoReplaceVisiblePropertyIds } from "../repo/calendar.repo";
export type CreateEventInput = {
  projectId: string;
  collectionId: string;
  userId: string;
  title?: string;
  mode?: "single" | "range";
  date?: string; // YYYY-MM-DD
  start?: string; // YYYY-MM-DD
  end?: string; // YYYY-MM-DD
  inheritAllCalendarProps?: boolean;
};

export async function createEventSvc(input: CreateEventInput) {
  const {
    projectId,
    collectionId,
    userId,
    title = "New event",
    mode = "single",
    date,
    start,
    end,
    inheritAllCalendarProps = true,
  } = input;

  if (mode === "single" && !date) throw new Error("date required");
  if (mode === "range") {
    if (!start || !end) throw new Error("start/end required");
    if (parseYmdToUTC(start) > parseYmdToUTC(end)) {
      throw new Error("start must be <= end");
    }
  }

  // 1) Create the document with valid TipTap content (repo should seed {type:"doc",content:[]})
  const doc = await repoCreateDocument(
    projectId,
    title.trim().slice(0, 255),
    userId
  );

  try {
    // 2) Link into the calendar collection
    await repoLinkToCollection(collectionId, doc.id, userId);

    // 3) (Optional) If your DocumentService.patchHeader enforces invariants beyond just setting title,
    //    keep this; otherwise you can remove it as we already created the doc with the title.
    // await DocumentService.patchHeader(projectId, doc.id, { title: title.trim().slice(0, 255) });

    // 4) Ensure/link date property DEFINITIONS, then set VALUES via DocumentService
    if (mode === "single") {
      const dateDef = await repoEnsureDatePropDef(
        projectId,
        CAL_BINDINGS.single
      );
      await repoEnsureDocProperty(doc.id, dateDef.id);
      await DocumentService.setPropertyValue(projectId, doc.id, dateDef.id, {
        type: "date_time",
        value: parseYmdToUTC(date!).toISOString(),
      });
    } else {
      const startDef = await repoEnsureDatePropDef(
        projectId,
        CAL_BINDINGS.range.start
      );
      const endDef = await repoEnsureDatePropDef(
        projectId,
        CAL_BINDINGS.range.end
      );
      await repoEnsureDocProperty(doc.id, startDef.id);
      await repoEnsureDocProperty(doc.id, endDef.id);
      await DocumentService.setPropertyValue(projectId, doc.id, startDef.id, {
        type: "date_time",
        value: parseYmdToUTC(start!).toISOString(),
      });
      await DocumentService.setPropertyValue(projectId, doc.id, endDef.id, {
        type: "date_time",
        value: parseYmdToUTC(end!).toISOString(),
      });
    }

    // 5) Inherit all other property DEFINITIONS used in this calendar (no values)
    if (inheritAllCalendarProps) {
      const defs = await repoGetCollectionPropDefs(collectionId);
      const skip =
        mode === "single"
          ? new Set([CAL_BINDINGS.single])
          : new Set([CAL_BINDINGS.range.start, CAL_BINDINGS.range.end]);

      await Promise.all(
        defs
          .filter((d) => !skip.has(d.name))
          .map((d) => repoEnsureDocProperty(doc.id, d.id))
      );
    }

    // 6) Return the full header (matches your doc module’s “non-collection doc GET” shape)
    const header = await DocumentService.getHeader(projectId, doc.id);
    return { document: header };
  } catch (err) {
    // If any step after creation fails, delete the doc to avoid orphaned rows
    // (You can remove this if you prefer to keep partially created docs for debugging.)
    try {
      await repoDeleteDocument(doc.id);
    } catch {}
    throw err;
  }
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

export async function moveEventSvc(params: {
  documentId: string;
  deltaDays: number;
  projectId?: string;
}) {
  const { documentId, deltaDays, projectId } = params;
  const resolvedProjectId = await resolveAndAssertProjectId(
    documentId,
    projectId
  );

  const { defs, values } = await repoReadDocDateValues(
    resolvedProjectId,
    documentId
  );

  // single-day
  if (defs.date?.id && values[defs.date.id]) {
    const next = addDaysUTC(values[defs.date.id]!, deltaDays);
    await DocumentService.setPropertyValue(
      resolvedProjectId,
      documentId,
      defs.date.id,
      {
        type: "date_time",
        value: next.toISOString(),
      }
    );
    return;
  }

  // range
  if (
    defs.start?.id &&
    defs.end?.id &&
    values[defs.start.id] &&
    values[defs.end.id]
  ) {
    const nextStart = addDaysUTC(values[defs.start.id]!, deltaDays);
    const nextEnd = addDaysUTC(values[defs.end.id]!, deltaDays);
    await Promise.all([
      DocumentService.setPropertyValue(
        resolvedProjectId,
        documentId,
        defs.start.id,
        { type: "date_time", value: nextStart.toISOString() }
      ),
      DocumentService.setPropertyValue(
        resolvedProjectId,
        documentId,
        defs.end.id,
        { type: "date_time", value: nextEnd.toISOString() }
      ),
    ]);
  }
}

export async function resizeEventSvc(params: {
  documentId: string;
  edge: "start" | "end";
  to: string;
  projectId?: string;
}) {
  const { documentId, edge, to, projectId } = params;
  const resolvedProjectId = await resolveAndAssertProjectId(
    documentId,
    projectId
  );

  const { defs, values } = await repoReadDocDateValues(
    resolvedProjectId,
    documentId
  );
  const toDate = parseYmdToUTC(to);

  // single-day
  if (defs.date?.id && values[defs.date.id]) {
    // If user resizes the "end" edge, interpret as "convert to range".
    if (edge === "end") {
      await convertSingleToRange({
        projectId: resolvedProjectId,
        documentId,
        endYmd: to, // YYYY-MM-DD
      });
      return;
    }
    await DocumentService.setPropertyValue(
      resolvedProjectId,
      documentId,
      defs.date.id,
      {
        type: "date_time",
        value: toDate.toISOString(),
      }
    );
    return;
  }

  if (!defs.start?.id || !defs.end?.id) return;

  if (edge === "start") {
    const curEnd = values[defs.end.id];
    if (curEnd && toDate > curEnd) throw new Error("start cannot be after end");
    await DocumentService.setPropertyValue(
      resolvedProjectId,
      documentId,
      defs.start.id,
      {
        type: "date_time",
        value: toDate.toISOString(),
      }
    );
  } else {
    const curStart = values[defs.start.id];
    if (curStart && toDate < curStart)
      throw new Error("end cannot be before start");
    await DocumentService.setPropertyValue(
      resolvedProjectId,
      documentId,
      defs.end.id,
      {
        type: "date_time",
        value: toDate.toISOString(),
      }
    );
  }
}

export async function renameEventSvc(params: {
  documentId: string;
  title: string;
  projectId?: string;
}) {
  const { documentId, title, projectId } = params;
  const resolvedProjectId = await resolveAndAssertProjectId(
    documentId,
    projectId
  );

  // Use the Document module so all header rules are centralized
  await DocumentService.patchHeader(resolvedProjectId, documentId, {
    title: title.trim().slice(0, 255),
  });
}

export async function deleteEventSvc(
  documentId: string,
  projectIdFromUrl?: string
) {
  // Optional safety: verify the URL projectId matches the document’s real projectId
  if (projectIdFromUrl) {
    const actual = await repoGetDocumentProjectId(documentId);
    if (!actual) throw new Error("document not found");
    if (actual !== projectIdFromUrl)
      throw new Error("project mismatch for document");
  }

  await repoDeleteDocument(documentId);
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

/** PUT /calendar/settings */
export async function setSettings(
  _projectId: string,
  _docId: string,
  collectionId: string,
  visiblePropertyIds: string[]
) {
  // You can add guards here (e.g., verify propertyIds belong to project) if desired.
  await repoReplaceVisiblePropertyIds(collectionId, visiblePropertyIds);
  return { visiblePropertyIds };
}

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

/** Convert a single-date document to a start/end range in a safe way. */
async function convertSingleToRange(params: {
  projectId: string;
  documentId: string;
  endYmd: string; // YYYY-MM-DD
}) {
  const { projectId, documentId, endYmd } = params;

  const { defs, values } = await repoReadDocDateValues(projectId, documentId);

  // Require an existing single date value.
  if (!defs.date?.id || !values[defs.date.id]) {
    throw new Error("cannot convert: no single date on document");
  }

  // Normalize: the single date becomes the start.
  const startDate = values[defs.date.id]!;
  const endDate = parseYmdToUTC(endYmd);

  // Ensure range definitions exist (create/link if needed).
  const startDef = await repoEnsureDatePropDef(
    projectId,
    CAL_BINDINGS.range.start
  );
  const endDef = await repoEnsureDatePropDef(projectId, CAL_BINDINGS.range.end);
  await repoEnsureDocProperty(documentId, startDef.id);
  await repoEnsureDocProperty(documentId, endDef.id);

  // If end < start, clamp to start (or, if you prefer, swap them).
  const safeEnd = endDate < startDate ? startDate : endDate;

  // Write values through the DocumentService (keeps rules centralized).
  await Promise.all([
    DocumentService.setPropertyValue(projectId, documentId, startDef.id, {
      type: "date_time",
      value: startDate.toISOString(),
    }),
    DocumentService.setPropertyValue(projectId, documentId, endDef.id, {
      type: "date_time",
      value: safeEnd.toISOString(),
    }),
  ]);
  // Optionally: remove the single date property from the document.

  // Resolve projectId for a document; if a projectId is provided, verify it matches.
  async function resolveAndAssertProjectId(
    documentId: string,
    providedProjectId?: string
  ): Promise<string> {
    const actual = await repoGetDocumentProjectId(documentId);
    if (!actual) throw new Error("document not found");
    if (providedProjectId && providedProjectId !== actual) {
      throw new Error("project mismatch for document");
    }
    return actual;
  }
}
