import { prisma } from "@/lib/prisma";

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

  const defs = await prisma.propertyDefinition.findMany({
    where: { projectId, name: { in: wanted }, type: "date" },
    select: { id: true, name: true },
  });
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
