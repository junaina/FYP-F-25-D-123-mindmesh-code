import { prisma } from "@/lib/prisma";

export const CollectionBoardRepo = {
  async getCollection(projectId: string, collectionId: string) {
    return prisma.collection.findFirst({
      where: { id: collectionId, document: { projectId } },
      select: {
        id: true,
        name: true,
        documentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async listDocIds(collectionId: string) {
    const rows = await prisma.collectionItem.findMany({
      where: { collectionId },
      select: { documentId: true },
    });
    return rows.map((r) => r.documentId);
  },

  async docsMeta(docIds: string[]) {
    if (docIds.length === 0)
      return [] as { id: string; title: string; description: string | null }[];
    return prisma.document.findMany({
      where: { id: { in: docIds } },
      select: { id: true, title: true, description: true },
    });
  },

  async statusUsageForDocs(projectId: string, docIds: string[]) {
    if (docIds.length === 0)
      return [] as { propertyId: string; count: number }[];
    const grouped = await prisma.documentProperty.groupBy({
      by: ["propertyId"],
      where: {
        documentId: { in: docIds },
        property: { projectId, type: "status" },
      },
      _count: { propertyId: true },
    });
    return grouped.map((g) => ({
      propertyId: g.propertyId,
      count: g._count.propertyId,
    }));
  },

  async getStatusProperty(propertyId: string) {
    return prisma.propertyDefinition.findUnique({
      where: { id: propertyId },
      include: { options: { orderBy: { position: "asc" } } },
    });
  },

  async getPropertyValuesForDocs(propertyId: string, docIds: string[]) {
    if (docIds.length === 0)
      return [] as { documentId: string; optionId: string | null }[];
    const rows = await prisma.documentPropertyValue.findMany({
      where: { propertyId, documentId: { in: docIds } },
      select: { documentId: true, optionId: true },
    });
    return rows.map((r) => ({
      documentId: r.documentId,
      optionId: r.optionId,
    }));
  },
};
