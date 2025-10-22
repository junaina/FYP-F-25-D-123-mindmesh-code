import { prisma } from "@/lib/prisma";
const DATE_PROP_TYPE = "date_time";
type CreateCollectionArgs = {
  documentId: string;
  createdById: string;
  name: string;
  type: "calendar";
};

/** Resolve the propertyDefinition ids for date bindings in a project. */
export async function repoGetDatePropIds(
  projectId: string,
  names: { single?: string; start?: string; end?: string }
) {
  const wanted = [names.single, names.start, names.end].filter(
    Boolean
  ) as string[];
  if (!wanted.length)
    return { singleId: undefined, startId: undefined, endId: undefined };

  let defs = await prisma.propertyDefinition.findMany({
    where: { projectId, name: { in: wanted }, type: DATE_PROP_TYPE },
    select: { id: true, name: true },
  });
  // fallback to legacy "date"
  if (defs.length === 0) {
    defs = await prisma.propertyDefinition.findMany({
      where: { projectId, name: { in: wanted }, type: "date" },
      select: { id: true, name: true, type: true },
    });
  }
  const map = Object.fromEntries(defs.map((d) => [d.name, d.id]));
  return {
    singleId: map[names.single!],
    startId: map[names.start!],
    endId: map[names.end!],
  };
}

/** Minimal headers for all EVENT docs in a collection (doc-scoped through Document). */
export async function repoGetEventDocHeaders(
  projectId: string,
  docId: string,
  collectionId: string
) {
  const items = await prisma.collectionItem.findMany({
    where: {
      collectionId,
      collection: { document: { id: docId, projectId } },
    },
    select: {
      document: {
        select: { id: true, title: true, createdAt: true, updatedAt: true },
      },
    },
  });
  return items.map((i) => i.document);
}

/** Visible property ids for this collection (doc-scoped through Document). */
export async function repoGetVisiblePropertyIds(
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
}

/** Bulk fetch values for given docs+props. */
export async function repoGetDocumentPropertyValues(
  documentIds: string[],
  propertyIds: string[]
) {
  if (!documentIds.length || !propertyIds.length) return [];
  return prisma.documentPropertyValue.findMany({
    where: { documentId: { in: documentIds }, propertyId: { in: propertyIds } },
    select: {
      documentId: true,
      propertyId: true,
      valueString: true,
      valueNumber: true,
      valueBool: true,
      valueDate: true,
      valueJson: true,
      optionId: true,
    },
  });
}

/** Unique property defs used by any event doc in this collection (doc-scoped through Document). */
export async function repoGetUsedPropertyDefsForCollection(
  projectId: string,
  docId: string,
  collectionId: string
) {
  // 1) gather event doc ids under this collection, scoped to the parent doc/project via Document
  const eventDocIds = (
    await prisma.collectionItem.findMany({
      where: {
        collectionId,
        collection: { document: { id: docId, projectId } },
      },
      select: { documentId: true },
    })
  ).map((x) => x.documentId);

  if (!eventDocIds.length) return [];

  // 2) which properties are used by those docs?
  const used = await prisma.documentProperty.findMany({
    where: { documentId: { in: eventDocIds } },
    select: { propertyId: true },
    distinct: ["propertyId"],
  });
  const propIds = used.map((u) => u.propertyId);
  if (!propIds.length) return [];

  // 3) return id/name/type for menu rendering
  return prisma.propertyDefinition.findMany({
    where: { id: { in: propIds } },
    select: { id: true, name: true, type: true },
  });
}

/** Map propertyId -> type (handy for casting values). */
export async function repoGetPropertyTypes(propertyIds: string[]) {
  if (!propertyIds.length) return new Map<string, string>();
  const defs = await prisma.propertyDefinition.findMany({
    where: { id: { in: propertyIds } },
    select: { id: true, type: true },
  });
  return new Map(defs.map((d) => [d.id, d.type]));
}

// ---------- PropertyDefinitions / Values ----------
export async function repoEnsureDatePropDef(projectId: string, name: string) {
  const existing = await prisma.propertyDefinition.findFirst({
    where: { projectId, name },
  });
  if (existing) return existing;
  return prisma.propertyDefinition.create({
    data: { projectId, name, type: DATE_PROP_TYPE },
  });
}

export async function repoEnsureDocProperty(
  documentId: string,
  propertyId: string
) {
  return prisma.documentProperty.upsert({
    where: { documentId_propertyId: { documentId, propertyId } },
    update: {},
    create: { documentId, propertyId },
  });
}

export async function repoUpsertDateValue(
  documentId: string,
  propertyId: string,
  value: Date
) {
  return prisma.documentPropertyValue.upsert({
    where: { documentId_propertyId: { documentId, propertyId } },
    update: {
      valueDate: value,
      valueString: null,
      valueNumber: null,
      valueBool: null,
      valueJson: undefined,
      optionId: null,
    },
    create: { documentId, propertyId, valueDate: value },
  });
}

export async function repoGetDatePropDefs(projectId: string) {
  const defs = await prisma.propertyDefinition.findMany({
    where: {
      projectId,
      name: { in: ["date", "start", "end"] },
      type: DATE_PROP_TYPE,
    },
  });
  const map = Object.fromEntries(defs.map((d) => [d.name, d]));
  return {
    date: map["date"] ?? null,
    start: map["start"] ?? null,
    end: map["end"] ?? null,
  };
}

export async function repoGetCollectionPropDefs(collectionId: string) {
  const items = await prisma.collectionItem.findMany({
    where: { collectionId },
    select: { documentId: true },
  });
  const docIds = items.map((i) => i.documentId);
  if (!docIds.length) return [];
  const docProps = await prisma.documentProperty.findMany({
    where: { documentId: { in: docIds } },
    distinct: ["propertyId"],
    select: { propertyId: true },
  });
  if (!docProps.length) return [];
  return prisma.propertyDefinition.findMany({
    where: { id: { in: docProps.map((p) => p.propertyId) } },
  });
}

// ---------- Documents / Collection Items ----------
const EMPTY_TIPTAP_DOC = { type: "doc", content: [] as any[] };
export async function repoCreateDocument(
  projectId: string,
  title: string,
  createdById: string
) {
  return prisma.document.create({
    data: { projectId, title, content: EMPTY_TIPTAP_DOC, createdById },
  });
}

export async function repoLinkToCollection(
  collectionId: string,
  documentId: string,
  addedById: string
) {
  return prisma.collectionItem.create({
    data: { collectionId, documentId, addedById },
  });
}

//creating a collection
export async function repoCreateCollection(args: CreateCollectionArgs) {
  const { documentId, createdById, name, type } = args;
  const row = await prisma.collection.create({
    data: { documentId, createdById, name, type },
    select: { id: true },
  });
  return row;
}

export async function repoUpdateDocumentTitle(
  documentId: string,
  title: string
) {
  await prisma.document.update({ where: { id: documentId }, data: { title } });
}

export async function repoDeleteDocument(documentId: string) {
  await prisma.document.delete({ where: { id: documentId } });
}

export async function repoUnlinkFromCollection(
  collectionId: string,
  documentId: string
) {
  await prisma.collectionItem.delete({
    where: { collectionId_documentId: { collectionId, documentId } },
  });
}

// ---------- Read current date values for a doc ----------
export async function repoReadDocDateValues(
  projectId: string,
  documentId: string
) {
  const defs = await repoGetDatePropDefs(projectId);
  const ids = [defs.date?.id, defs.start?.id, defs.end?.id].filter(
    Boolean
  ) as string[];
  if (!ids.length) return { defs, values: {} as Record<string, Date | null> };

  const vals = await prisma.documentPropertyValue.findMany({
    where: { documentId, propertyId: { in: ids } },
    select: { propertyId: true, valueDate: true },
  });
  const values = Object.fromEntries(
    vals.map((v) => [v.propertyId, v.valueDate])
  );
  return { defs, values };
}
// Replace all visible property rows for a collection with the provided ids
export async function repoReplaceVisiblePropertyIds(
  collectionId: string,
  propertyIds: string[]
) {
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
}
// Get the owning project for a document (null if not found)
export async function repoGetDocumentProjectId(
  documentId: string
): Promise<string | null> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { projectId: true },
  });
  return doc?.projectId ?? null;
}
