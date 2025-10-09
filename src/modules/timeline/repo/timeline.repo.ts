import { prisma } from "@/lib/prisma";

const DATE_PROP_TYPE = "date_time";

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
};
