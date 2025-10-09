import { TimelineRepo } from "../repo/timeline.repo";
import type { TimelineEvent } from "../dto/timeline.dto";
import { requireUser } from "@/lib/auth";
import { DocumentService } from "@/modules/documents/services/document.service";
import { CreateTimelineEventInput } from "../dto/timeline.dto";
import type { CreateTimelineInput } from "../dto/timeline.dto";

const DATE_PROP_TYPE = "date_time";
const START = "start";
const END = "end";

//normalize a single property value row to a JSON-serializable value
function toValue(pv: {
  valueString: string | null;
  valueNumber: number | null;
  valueBool: boolean | null;
  valueDate: Date | null;
  valueJson: unknown | null;
  optionId: string | null;
  property?: { type?: string | null } | null;
}) {
  const kind = pv.property?.type ?? null;
  if (kind === "date" || kind === "date_time") {
    return pv.valueDate ? pv.valueDate.toISOString() : null;
  }
  if (kind === "number") return pv.valueNumber;
  if (kind === "checkbox") return Boolean(pv.valueBool);
  if (kind === "multi_select") return pv.valueJson as string[] | unknown;
  if (kind === "select") return pv.optionId;
  if (kind == "file" || kind === "person")
    return pv.valueJson as string | unknown;
  //text/email/url/phone
  return pv.valueJson ?? pv.valueString ?? null;
}
export const TimelineService = {
  //listing evevnts for the given collection scoped to project and document
  //returns timelineeventdto
  async listEvents(params: {
    projectId: string;
    docId: string;
    collectionId: string;
  }): Promise<TimelineEvent[]> {
    const { projectId, docId, collectionId } = params;
    const items = await TimelineRepo.findEventsByCollection(
      projectId,
      docId,
      collectionId
    );
    return items.map((item) => {
      const doc = item.document;
      const startRow = doc.propertyValues.find(
        (pv) => pv.property?.name === START
      );
      const endRow = doc.propertyValues.find((pv) => pv.property?.name === END);

      const start = startRow?.valueDate
        ? startRow.valueDate.toISOString()
        : null;
      const end = endRow?.valueDate ? endRow.valueDate.toISOString() : null;
      return {
        id: doc.id,
        title: doc.title,
        start,
        end,
        addedById: item.addedById,
        properties: doc.propertyValues.map((pv) => ({
          id: pv.property?.id ?? pv.propertyId, // prefer definition id
          name: pv.property?.name ?? "",
          type: pv.property?.type ?? "",
          value: toValue(pv),
        })),
      };
    });
  },
  //list timelines (collections) for the given doc
  async listTimelinesForDoc(params: { projectId: string; docId: string }) {
    const { docId } = params;
    return TimelineRepo.listTimelineCollectionsByDoc(docId);
  },
  //CREATE EVENTS
  async createTimeline(args: {
    projectId: string; // for routing symmetry; not used in repo write
    docId: string;
    data: CreateTimelineInput;
  }) {
    const { docId, data } = args;
    const user = await requireUser();

    const row = await TimelineRepo.createTimelineCollection({
      documentId: docId,
      name: data.name ?? "Timeline",
      createdById: user.id,
    });

    return row; // { id, documentId, name, type, createdById }
  },
  async createEvent(params: {
    projectId: string;
    collectionId: string;
    data: CreateTimelineEventInput;
  }) {
    const { projectId, collectionId, data } = params;
    const user = await requireUser();
    //creating a doc and linking it to the collection
    const doc = await TimelineRepo.createDocument(
      projectId,
      data.title.trim().slice(0, 255),
      user.id
    );
    await TimelineRepo.linkToCollection(collectionId, doc.id, user.id);
    // 2) ensure start/end definitions & links
    const startDef = await TimelineRepo.ensureDatePropDef(projectId, START);
    const endDef = await TimelineRepo.ensureDatePropDef(projectId, END);
    await TimelineRepo.ensureDocProperty(doc.id, startDef.id);
    await TimelineRepo.ensureDocProperty(doc.id, endDef.id);

    // 3) write values via DocumentService (central rules)
    await Promise.all([
      DocumentService.setPropertyValue(projectId, doc.id, startDef.id, {
        type: DATE_PROP_TYPE,
        value: data.start,
      }),
      DocumentService.setPropertyValue(projectId, doc.id, endDef.id, {
        type: DATE_PROP_TYPE,
        value: data.end,
      }),
    ]);
    return {
      id: doc.id,
      title: data.title,
      start: data.start,
      end: data.end,
      addedById: user.id,
      collectionId,
    };
  },
  //PATCH A TIMELINE NAME
  async renameTimeline(params: {
    projectId: string;
    docId: string;
    collectionId: string;
    name: string;
  }) {
    const { projectId, docId, collectionId, name } = params;
    // (Auth optional here in dev since you're bypassing elsewhere.)
    return TimelineRepo.updateTimelineName({
      projectId,
      docId,
      collectionId,
      name: name.trim().slice(0, 120),
    });
  },
  //toggle visible properties ona  timeline
  async getTimelineProperties(params: {
    projectId: string;
    docId: string;
    collectionId: string;
  }) {
    const { projectId, docId, collectionId } = params;
    const properties = await TimelineRepo.getUsedPropertyDefsForCollection(
      projectId,
      docId,
      collectionId
    );
    const visiblePropertyIds = await TimelineRepo.getVisiblePropertyIds(
      projectId,
      docId,
      collectionId
    );
    return { properties, visiblePropertyIds };
  },
  //put: replacing the visible set of properties
  async setTimelineVisibleProperties(params: {
    projectId: string;
    docId: string;
    collectionId: string;
    visiblePropertyIds: string[];
  }) {
    const { projectId, docId, collectionId, visiblePropertyIds } = params;

    // Optional guard (cheap): only allow ids that appear in the union list
    const used = await TimelineRepo.getUsedPropertyDefsForCollection(
      projectId,
      docId,
      collectionId
    );
    const allowed = new Set(used.map((u) => u.id));
    const filtered = visiblePropertyIds.filter((id) => allowed.has(id));

    await TimelineRepo.replaceVisiblePropertyIds(collectionId, filtered);
    return { properties: used, visiblePropertyIds: filtered };
  },
  async deleteEvent(params: {
    projectId: string;
    docId: string;
    collectionId: string;
    documentId: string;
  }) {
    const { projectId, docId, collectionId, documentId } = params;

    // Ensure the doc really belongs to this timeline
    await TimelineRepo.assertEventBelongsToTimeline({
      projectId,
      docId,
      collectionId,
      documentId,
    });

    // Delete the document (cascades CollectionItem by FK)
    await TimelineRepo.deleteDocument(documentId);

    return { success: true as const };
  },
};
