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
  repoCreateCollection,
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
  repoGetOptionsByPropertyIds,
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
  date?: string; 
  start?: string; 
  end?: string; 
  inheritAllCalendarProps?: boolean;
};
export async function resolveAndAssertProjectId(
  documentId: string,
  provided?: string
): Promise<string> {
  const actual = await repoGetDocumentProjectId(documentId);
  if (!actual) {
    throw new Error("document not found");
  }
  if (provided && provided !== actual) {
    throw new Error("project mismatch for document");
  }
  return actual;
}

export async function createCalendarCollection(input: {
  projectId?: string;
  docId: string;
  userId: string;
  name?: string;
  autoBindDateProperty?: boolean;
}) {
  const { docId, userId } = input;
  const name = input.name ?? "Untitled Calendar";
  const autoBind = input.autoBindDateProperty ?? true;

  const actualProjectId = await resolveAndAssertProjectId(
    docId,
    input.projectId
  );
  const { id: collectionId } = await repoCreateCollection({
    documentId: docId,
    createdById: userId,
    name,
    type: "calendar",
  });
  if (autoBind) {
    await repoEnsureDatePropDef(actualProjectId, CAL_BINDINGS.single);
    await repoEnsureDatePropDef(actualProjectId, CAL_BINDINGS.range.start);
    await repoEnsureDatePropDef(actualProjectId, CAL_BINDINGS.range.end);
  }

  return { id: collectionId };
}

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

  const doc = await repoCreateDocument(
    projectId,
    title.trim().slice(0, 255),
    userId
  );

  try {
    await repoLinkToCollection(collectionId, doc.id, userId);

    
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

    if (inheritAllCalendarProps) {
      const defs = await repoGetCollectionPropDefs(collectionId);
      const skip =
        mode === "single"
          ? new Set<string>([CAL_BINDINGS.single])
          : new Set<string>([CAL_BINDINGS.range.start, CAL_BINDINGS.range.end]);

      await Promise.all(
        defs
          .filter((d) => !skip.has(d.name))
          .map((d) => repoEnsureDocProperty(doc.id, d.id))
      );
    }

    const header = await DocumentService.getHeader(projectId, doc.id);
    return { document: header };
  } catch (err) {
   
    try {
      await repoDeleteDocument(doc.id);
    } catch {}
    throw err;
  }
}

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
  const selectLikeIds = defs
    .filter((d) => ["select", "status", "multi_select"].includes(d.type))
    .map((d) => d.id);
  const optionsByProp = await repoGetOptionsByPropertyIds(selectLikeIds);

  return {
    properties: defs.map((d) => ({
      id: d.id,
      name: d.name,
      kind: d.type === "date" ? "date_time" : d.type,
      options: optionsByProp.get(d.id) ?? undefined,
    })),
  };
}

export async function listInstances(
  projectId: string,
  collectionId: string,
  fromISO: string,
  toISO: string,
  docId?: string
): Promise<{ instances: CalendarInstance[] }> {
  const from = new Date(fromISO);
  const to = new Date(toISO);

  const docs = await repoGetEventDocHeaders(projectId, docId!, collectionId);
  const docIds = docs.map((d) => d.id);
  if (!docIds.length) return { instances: [] };

  const { singleId, startId, endId } = await repoGetDatePropIds(
    projectId,
    DEFAULT_BINDINGS
  );

  const visiblePropIds = await repoGetVisiblePropertyIds(
    projectId,
    docId!,
    collectionId
  );

  const typeByPropId = await repoGetPropertyTypes(visiblePropIds);

  const wantedPropIds = [singleId, startId, endId, ...visiblePropIds].filter(
    Boolean
  ) as string[];
  const values = await repoGetDocumentPropertyValues(docIds, wantedPropIds);

  const byDoc = new Map<string, typeof values>();
  for (const v of values) {
    const arr = byDoc.get(v.documentId);
    if (arr) arr.push(v);
    else byDoc.set(v.documentId, [v]);
  }

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

  if (defs.date?.id && values[defs.date.id]) {
    if (edge === "end") {
      await convertSingleToRange({
        projectId: resolvedProjectId,
        documentId,
        endYmd: to, 
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

  await DocumentService.patchHeader(resolvedProjectId, documentId, {
    title: title.trim().slice(0, 255),
  });
}

export async function deleteEventSvc(
  documentId: string,
  projectIdFromUrl?: string
) {
  if (projectIdFromUrl) {
    const actual = await repoGetDocumentProjectId(documentId);
    if (!actual) throw new Error("document not found");
    if (actual !== projectIdFromUrl)
      throw new Error("project mismatch for document");
  }

  await repoDeleteDocument(documentId);
}

export async function getSettings(
  projectId: string,
  docId: string,
  collectionId: string
) {
  const ids = await repoGetVisiblePropertyIds(projectId, docId, collectionId);
  return { visiblePropertyIds: ids };
}

export async function setSettings(
  _projectId: string,
  _docId: string,
  collectionId: string,
  visiblePropertyIds: string[]
) {
  await repoReplaceVisiblePropertyIds(collectionId, visiblePropertyIds);
  return { visiblePropertyIds };
}

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

async function convertSingleToRange(params: {
  projectId: string;
  documentId: string;
  endYmd: string; 
}) {
  const { projectId, documentId, endYmd } = params;

  const { defs, values } = await repoReadDocDateValues(projectId, documentId);

  if (!defs.date?.id || !values[defs.date.id]) {
    throw new Error("cannot convert: no single date on document");
  }

  const startDate = values[defs.date.id]!;
  const endDate = parseYmdToUTC(endYmd);

  const startDef = await repoEnsureDatePropDef(
    projectId,
    CAL_BINDINGS.range.start
  );
  const endDef = await repoEnsureDatePropDef(projectId, CAL_BINDINGS.range.end);
  await repoEnsureDocProperty(documentId, startDef.id);
  await repoEnsureDocProperty(documentId, endDef.id);

  const safeEnd = endDate < startDate ? startDate : endDate;

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
