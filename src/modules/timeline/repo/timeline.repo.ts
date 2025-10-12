import { prisma } from "@/lib/prisma";

const DATE_PROP_TYPE = "date_time";
const START = "start";
const END = "end";
// load property defs (no options yet)
export async function getPropertyDefs(
  projectId: string,
  propertyIds: string[]
) {
  return prisma.propertyDefinition.findMany({
    where: { projectId, id: { in: propertyIds } },
    select: { id: true, name: true, type: true },
    orderBy: { name: "asc" },
  });
}

// load options for a set of propertyIds
export async function getOptionsForPropertyIds(propertyIds: string[]) {
  if (!propertyIds.length) return [];
  return prisma.propertyOption.findMany({
    where: { propertyId: { in: propertyIds } },
    select: {
      id: true,
      value: true,
      propertyId: true,
      position: true,
      color: true,
    },
    orderBy: [{ position: "asc" }, { value: "asc" }], // fall back to value
  });
}
export const TimelineRepo = {
  async createTimelineCollection(args: {
    documentId: string;
    name: string;
    createdById: string;
  }) {
    const { documentId, name, createdById } = args;
    return prisma.collection.create({
      data: {
        documentId,
        name,
        type: "timeline",
        createdById,
      },
      select: {
        id: true,
        documentId: true,
        name: true,
        type: true,
        createdById: true,
      },
    });
  },
  async listTimelineCollectionsByDoc(docId: string) {
    return prisma.collection.findMany({
      where: { documentId: docId, type: "timeline" },
      select: {
        id: true,
        documentId: true,
        name: true,
        type: true,
        createdById: true,
      },
      orderBy: { createdAt: "asc" },
    });
  },
  async findTimelineCollectionByName(documentId: string, name: string) {
    return prisma.collection.findFirst({
      where: { documentId, type: "timeline", name },
      select: {
        id: true,
        documentId: true,
        name: true,
        type: true,
        createdById: true,
      },
    });
  },
  async findEventsByCollection(
    projectId: string,
    docId: string,
    collectionId: string
  ) {
    return prisma.collectionItem.findMany({
      where: {
        collectionId,
        collection: {
          document: {
            id: docId,
            projectId,
          },
        },
      },
      select: {
        addedById: true,
        document: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            updatedAt: true,
            propertyValues: {
              include: { property: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  },

  async linkToCollection(
    collectionId: string,
    documentId: string,
    addedById: string
  ) {
    return prisma.collectionItem.create({
      data: { collectionId, documentId, addedById },
      select: {
        collectionId: true,
        documentId: true,
        addedById: true,
      },
    });
  },
  //date property defs and links
  async ensureDatePropDef(projectId: string, name: string) {
    const found = await prisma.propertyDefinition.findFirst({
      where: { projectId, name },
      select: {
        id: true,
        name: true,
        type: true,
      },
    });
    if (found) return found;
    return prisma.propertyDefinition.create({
      data: { projectId, name, type: DATE_PROP_TYPE },
      select: { id: true, name: true, type: true },
    });
  },
  async ensureDocProperty(documentId: string, propertyId: string) {
    return prisma.documentProperty.upsert({
      where: { documentId_propertyId: { documentId, propertyId } },
      update: {},
      create: { documentId, propertyId },
    });
  },
  /** POST: create a document seeded with empty TipTap content. */
  async createDocument(projectId: string, title: string, createdById: string) {
    const EMPTY_TIPTAP_DOC = { type: "doc", content: [] as any[] };
    return prisma.document.create({
      data: {
        projectId,
        title,
        createdById,
        content: EMPTY_TIPTAP_DOC,
      },
      select: { id: true, projectId: true, title: true },
    });
  },
  //PATCH timeline collection name
  async assertTimelineCollection(
    projectId: string,
    docId: string,
    collectionId: string
  ) {
    const row = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        documentId: docId,
        type: "timeline",
        document: { projectId },
      },
      select: { id: true },
    });
    if (!row) {
      throw Object.assign(new Error("timeline collection not found"), {
        code: "NOT_FOUND" as const,
      });
    }
  },
  //here i am renaming a timeline after its been asserted it exists
  async updateTimelineName(args: {
    projectId: string;
    docId: string;
    collectionId: string;
    name: string;
  }) {
    const { projectId, docId, collectionId, name } = args;
    await this.assertTimelineCollection(projectId, docId, collectionId);

    return prisma.collection.update({
      where: { id: collectionId },
      data: { name },
      select: {
        id: true,
        documentId: true,
        name: true,
        type: true,
        createdById: true,
      },
    });
  },
  //// get all events oc ids in this collection
  async getEventDocumentIds(
    projectId: string,
    docId: string,
    collectionId: string
  ) {
    const rows = await prisma.collectionItem.findMany({
      where: {
        collectionId,
        collection: { document: { id: docId, projectId } },
      },
      select: { documentId: true },
    });
    return rows.map((r) => r.documentId);
  },
  //unique property defs used by any event i the collection
  // ...
  async getUsedPropertyDefsForCollection(
    projectId: string,
    docId: string,
    collectionId: string
  ) {
    const docIds = await this.getEventDocumentIds(
      projectId,
      docId,
      collectionId
    );
    if (!docIds.length) return [];

    const used = await prisma.documentProperty.findMany({
      where: { documentId: { in: docIds } },
      distinct: ["propertyId"],
      select: { propertyId: true },
    });
    const propIds = used.map((u) => u.propertyId);
    if (!propIds.length) return [];

    // IMPORTANT: include `type`
    const defs = await prisma.propertyDefinition.findMany({
      where: { id: { in: propIds } },
      select: { id: true, name: true, type: true }, // <-- add type
      orderBy: { name: "asc" },
    });

    // normalize legacy "date" to "date_time" for UI
    const mapKind = (t: string) => (t === "date" ? "date_time" : t);

    return defs.map((d) => ({
      id: d.id,
      name: d.name,
      kind: mapKind(d.type),
    }));
  },
  // ...

  //currently visible ids for this collection
  async getVisiblePropertyIds(
    projectId: string,
    docId: string,
    collectionId: string
  ) {
    const rows = await prisma.viewPropertyVisibility.findMany({
      where: {
        collectionId,
        visible: true,
        collection: { document: { id: docId, projectId } },
      },
      select: { propertyId: true },
    });
    return rows.map((r) => r.propertyId);
  },
  //replacing the visible set for a collection in one transaction
  async replaceVisiblePropertyIds(collectionId: string, propertyIds: string[]) {
    await prisma.$transaction(async (tx) => {
      await tx.viewPropertyVisibility.deleteMany({ where: { collectionId } });
      if (propertyIds.length) {
        await tx.viewPropertyVisibility.createMany({
          data: propertyIds.map((propertyId) => ({
            collectionId,
            propertyId,
            visible: true,
          })),
          skipDuplicates: true,
        });
      }
    });
  },
  //verify the doc belongs to teh timeline

  async assertEventBelongsToTimeline(params: {
    projectId: string;
    docId: string;
    collectionId: string;
    documentId: string;
  }) {
    const { projectId, docId, collectionId, documentId } = params;
    const row = await prisma.collectionItem.findFirst({
      where: {
        collectionId,
        documentId,
        collection: { document: { id: docId, projectId } },
      },
      select: { collectionId: true, documentId: true },
    });
    if (!row) {
      throw Object.assign(new Error("event not found in this timeline"), {
        code: "NOT_FOUND" as const,
      });
    }
  },
  //delete the doc/event
  async deleteDocument(documentId: string) {
    await prisma.document.delete({ where: { id: documentId } });
  },
  async readDocStartEnd(projectId: string, documentId: string) {
    const defs = await prisma.propertyDefinition.findMany({
      where: { projectId, name: { in: [START, END] } },
      select: { id: true, name: true },
    });
    const map = new Map(defs.map((d) => [d.name, d.id]));
    const ids = Array.from(map.values());
    const vals = ids.length
      ? await prisma.documentPropertyValue.findMany({
          where: { documentId, propertyId: { in: ids } },
          select: { propertyId: true, valueDate: true },
        })
      : [];
    const values = Object.fromEntries(
      vals.map((v) => [v.propertyId, v.valueDate])
    );
    return {
      startId: map.get(START) ?? null,
      endId: map.get(END) ?? null,
      values,
    };
  },
  /** Ensure the date prop definitions exist, return their ids. */
  async ensureStartEndPropDefs(projectId: string) {
    // Try find existing first
    const existing = await prisma.propertyDefinition.findMany({
      where: { projectId, name: { in: [START, END] } },
      select: { id: true, name: true },
    });
    const hasStart = existing.find((d) => d.name === START)?.id;
    const hasEnd = existing.find((d) => d.name === END)?.id;

    const created: { startId?: string; endId?: string } = {};
    if (!hasStart) {
      const s = await prisma.propertyDefinition.create({
        data: { projectId, name: START, type: "date_time" },
        select: { id: true },
      });
      created.startId = s.id;
    }
    if (!hasEnd) {
      const e = await prisma.propertyDefinition.create({
        data: { projectId, name: END, type: "date_time" },
        select: { id: true },
      });
      created.endId = e.id;
    }

    return {
      startId: hasStart ?? created.startId!,
      endId: hasEnd ?? created.endId!,
    };
  },
};
