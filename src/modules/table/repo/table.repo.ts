import { prisma } from "@/lib/prisma";
import { DocumentRepo } from "@/modules/documents/repo/document.repo";

/**
 * IMPORTANT: Your schema:
 * - Collection { id, documentId, type, name, createdById, ... }
 * - CollectionItem requires addedById
 * - We verify project ownership by joining: collection.document.projectId
 */
const EMPTY_TIPTAP_DOC = {
  type: "doc",
  content: [{ type: "paragraph", content: [] }],
} as const;
export const TableRepo = {
  /* ---------- guards ---------- */
  async assertCollectionInProject(collectionId: string, projectId: string) {
    const row = await prisma.collection.findUnique({
      where: { id: collectionId },
      select: {
        id: true,
        type: true,
        document: { select: { projectId: true } },
      },
    });
    if (!row || row.type !== "TABLE" || row.document.projectId !== projectId) {
      throw new Error("Table collection not found in project");
    }
  },

  async assertDocInCollection(collectionId: string, docId: string) {
    const row = await prisma.collectionItem.findFirst({
      where: { collectionId, documentId: docId },
      select: { documentId: true },
    });
    if (!row) throw new Error("Doc not in this table");
  },

  /* ---------- collections / table ---------- */
  async createTableCollection(
    projectId: string,
    hostDocumentId: string,
    name: string,
    createdById: string
  ) {
    // verify host document belongs to this project
    const host = await prisma.document.findUnique({
      where: { id: hostDocumentId },
      select: { id: true, projectId: true },
    });
    if (!host || host.projectId !== projectId) {
      throw new Error("Host document not in project");
    }

    return prisma.collection.create({
      data: {
        name,
        type: "TABLE",
        documentId: hostDocumentId,
        createdById,
      },
      select: {
        id: true,
        name: true,
        type: true,
        documentId: true,
        createdAt: true,
      },
    });
  },

  async renameCollection(collectionId: string, name: string) {
    await prisma.collection.update({
      where: { id: collectionId },
      data: { name },
    });
  },

  /* ---------- membership ---------- */
  async docIdsInCollection(collectionId: string): Promise<string[]> {
    const rows = await prisma.collectionItem.findMany({
      where: { collectionId },
      select: { documentId: true },
    });
    return rows.map((r) => r.documentId);
  },

  async anyDocId(collectionId: string): Promise<string | null> {
    const row = await prisma.collectionItem.findFirst({
      where: { collectionId },
      select: { documentId: true },
    });
    return row?.documentId ?? null;
  },

  async addDocToCollection(
    collectionId: string,
    docId: string,
    addedById: string
  ) {
    await prisma.collectionItem.upsert({
      where: { collectionId_documentId: { collectionId, documentId: docId } },
      create: { collectionId, documentId: docId, addedById },
      update: {},
    });
  },

  /* ---------- properties @ table scope ---------- */
  async linkPropertyToDocs(propertyId: string, docIds: string[]) {
    if (docIds.length === 0) return;
    await prisma.$transaction(
      docIds.map((documentId) =>
        prisma.documentProperty.upsert({
          where: { documentId_propertyId: { documentId, propertyId } },
          create: { documentId, propertyId },
          update: {},
        })
      )
    );
  },

  async unlinkPropertyAcrossCollection(
    collectionId: string,
    propertyId: string
  ) {
    // remove link and value for every doc in this table
    const rows = await prisma.collectionItem.findMany({
      where: { collectionId },
      select: { documentId: true },
    });
    const docIds = rows.map((r) => r.documentId);
    await prisma.$transaction([
      prisma.documentPropertyValue.deleteMany({
        where: { propertyId, documentId: { in: docIds } },
      }),
      prisma.documentProperty.deleteMany({
        where: { propertyId, documentId: { in: docIds } },
      }),
    ]);

    // If not referenced anywhere else, GC def & options
    const remaining = await prisma.documentProperty.count({
      where: { propertyId },
    });
    if (remaining === 0) {
      await prisma.$transaction([
        prisma.propertyOption.deleteMany({ where: { propertyId } }),
        prisma.propertyDefinition.delete({ where: { id: propertyId } }),
      ]);
    }
  },

  /* ---------- schema (union of columns used by docs) ---------- */
  async unionProperties(projectId: string, docIds: string[]) {
    if (docIds.length === 0) return [];
    const links = await prisma.documentProperty.findMany({
      where: { documentId: { in: docIds } },
      select: { propertyId: true },
      distinct: ["propertyId"],
    });
    const propIds = links.map((l) => l.propertyId);
    const defs = await prisma.propertyDefinition.findMany({
      where: { id: { in: propIds }, projectId },
      include: {
        options: { orderBy: [{ position: "asc" }, { value: "asc" }] },
      },
    });
    return defs.map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      options: d.options.map((o) => ({
        id: o.id,
        value: o.value,
        color: o.color,
        position: o.position,
      })),
    }));
  },
  async listDocsWithValues(projectId: string, collectionId: string) {
    const items = await prisma.collectionItem.findMany({
      where: { collectionId },
      include: {
        document: {
          select: {
            id: true,
            projectId: true,
            title: true,
            description: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const rows = await Promise.all(
      items.map(async (it) => {
        const [props, vals] = await Promise.all([
          prisma.documentProperty.findMany({
            where: { documentId: it.document.id },
            include: {
              property: {
                // ✅ correct relation
                include: {
                  options: {
                    orderBy: [{ position: "asc" }, { value: "asc" }],
                  },
                },
              },
            },
          }),
          prisma.documentPropertyValue.findMany({
            where: { documentId: it.document.id },
            include: { option: true }, // ✅ correct join for select options
          }),
        ]);

        const properties = props.map((p) => {
          const value = vals.find((v) => v.propertyId === p.propertyId) ?? {
            id: null,
            documentId: it.document.id,
            propertyId: p.propertyId,
            valueString: null,
            valueNumber: null,
            valueBool: null,
            valueDate: null,
            valueJson: null,
            optionId: null,
            option: null,
            createdAt: null,
            updatedAt: null,
          };

          return {
            id: p.propertyId,
            type: p.property.type,
            name: p.property.name,
            options: p.property.options,
            value, // ✅ always present
          };
        });

        return { ...it.document, properties };
      })
    );

    return rows;
  },

  /* ---------- docs ---------- */
  async createDoc(
    projectId: string,
    title: string,
    description: string | null | undefined,
    userId: string
  ) {
    return prisma.document.create({
      data: {
        projectId,
        title,
        description: description ?? null,
        content: EMPTY_TIPTAP_DOC, // <-- change this line
        createdById: userId,
      },
      select: {
        id: true,
        projectId: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  /* ---------- options (thin wrappers for guards) ---------- */
  async readOptions(
    projectId: string,
    collectionId: string,
    propertyId: string
  ) {
    await this.assertCollectionInProject(collectionId, projectId);
    const docId = await this.anyDocId(collectionId);
    if (!docId) return [];
    return DocumentRepo.readPropertyOptions(projectId, docId, propertyId);
  },
  async unlinkDocFromCollection(collectionId: string, documentId: string) {
    return prisma.collectionItem.delete({
      where: { collectionId_documentId: { collectionId, documentId } },
    });
  },

  async deleteDocument(documentId: string) {
    // Your schema has cascading deletes on most doc relations,
    // so a hard delete here should cascade property links/values, etc.
    return prisma.document.delete({ where: { id: documentId } });
  },
};
// Returns the union of properties that should appear as columns in this collection:
// - properties explicitly visible for this view (ViewPropertyVisibility.visible = true)
// - any properties already used by docs in this collection (union)
export async function getCollectionColumnPropertyIds(collectionId: string) {
  // visible columns for this view
  const visible = await prisma.viewPropertyVisibility.findMany({
    where: { collectionId, visible: true },
    select: { propertyId: true },
  });

  // union of properties used by existing docs in this collection
  const docIds = await prisma.collectionItem.findMany({
    where: { collectionId },
    select: { documentId: true },
  });

  let used: { propertyId: string }[] = [];
  if (docIds.length) {
    used = await prisma.documentProperty.findMany({
      where: { documentId: { in: docIds.map((d) => d.documentId) } },
      distinct: ["propertyId"],
      select: { propertyId: true },
    });
  }

  const ids = new Set<string>();
  visible.forEach((v) => ids.add(v.propertyId));
  used.forEach((u) => ids.add(u.propertyId));
  return [...ids];
}

// Inserts DocumentProperty rows for a new document (skips duplicates).
export async function attachPropertiesToDocument(
  documentId: string,
  propertyIds: string[]
) {
  if (!propertyIds.length) return;
  await prisma.documentProperty.createMany({
    data: propertyIds.map((pid) => ({ documentId, propertyId: pid })),
    skipDuplicates: true,
  });
}
