// src/modules/table-view/services/collection.service.ts

import { PrismaClient, Prisma } from "@/generated/prisma";

const prisma = new PrismaClient();

type ListItemsQuery = {
  cursor?: string | null;
  limit: number;
  search?: string | null;
  includeProperties?: boolean;
  sort?: "createdAt" | "updatedAt" | "title";
  dir?: "asc" | "desc";
};

export class CollectionService {
  /* -------------------------- TABLE (Collection) CRUD -------------------------- */

  static async createTable(projectId: string, hostDocId: string, name = "Table") {
    const host = await prisma.document.findFirst({
      where: { id: hostDocId, projectId },
      select: { id: true, projectId: true, createdById: true },
    });
    if (!host) throw { code: "NOT_FOUND", message: "Host document not found" };

    return prisma.collection.create({
      data: {
        documentId: host.id,
        name,
        type: "table",
        createdById: host.createdById,
      },
    });
  }

  static async get(projectId: string, collectionId: string) {
    return prisma.collection.findFirst({
      where: { id: collectionId, document: { projectId }, type: "table" },
      include: {
        document: { select: { id: true, title: true } },
        propertyVisibility: {
          include: { property: { include: { options: true } } },
        },
      },
    });
  }

  static async list(projectId: string, hostDocId: string) {
    return prisma.collection.findMany({
      where: { documentId: hostDocId, document: { projectId }, type: "table" },
      orderBy: { createdAt: "desc" },
      include: {
        propertyVisibility: { select: { propertyId: true, visible: true } },
      },
    });
  }

  static async patch(_projectId: string, collectionId: string, patch: { name?: string }) {
    return prisma.collection.update({
      where: { id: collectionId },
      data: { name: patch.name ?? undefined },
    });
  }

  static async remove(_projectId: string, collectionId: string) {
    await prisma.collection.delete({ where: { id: collectionId } });
    return { ok: true };
  }

  /* -------------------- COLUMNS (ViewPropertyVisibility) -------------------- */

  static async listColumns(_projectId: string, collectionId: string) {
    return prisma.viewPropertyVisibility.findMany({
      where: { collectionId },
      include: { property: { include: { options: true } } },
      orderBy: { property: { name: "asc" } },
    });
  }

  static async addColumn(
    projectId: string,
    collectionId: string,
    body:
      | { propertyId: string; create?: undefined }
      | { propertyId?: undefined; create: { name: string; type: string; options?: Array<{ value: string; color?: string | null }> } }
  ) {
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, document: { projectId }, type: "table" },
      select: { id: true, document: { select: { projectId: true } } },
    });
    if (!collection) throw { code: "NOT_FOUND", message: "Collection not found" };

    let propertyId: string | undefined = "propertyId" in body ? body.propertyId : undefined;

    if (!propertyId && body.create) {
      const created = await prisma.propertyDefinition.create({
        data: {
          projectId,
          name: body.create.name,
          type: body.create.type,
          options: body.create.options?.length
            ? { create: body.create.options.map(o => ({ value: o.value, color: o.color ?? null })) }
            : undefined,
        },
      });
      propertyId = created.id;
    }
    if (!propertyId) throw { code: "VALIDATION", message: "propertyId or create is required" };

    // manual find-or-create (no @@unique in Prisma schema)
    const existing = await prisma.viewPropertyVisibility.findFirst({
      where: { collectionId, propertyId },
    });

    if (existing) {
      return prisma.viewPropertyVisibility.update({
        where: { id: existing.id },
        data: { visible: true },
      });
    } else {
      return prisma.viewPropertyVisibility.create({
        data: { collectionId, propertyId, visible: true },
      });
    }
  }

  static async setColumnVisible(
    _projectId: string,
    collectionId: string,
    propertyId: string,
    visible: boolean
  ) {
    const existing = await prisma.viewPropertyVisibility.findFirst({
      where: { collectionId, propertyId },
    });

    if (existing) {
      return prisma.viewPropertyVisibility.update({
        where: { id: existing.id },
        data: { visible },
      });
    } else {
      return prisma.viewPropertyVisibility.create({
        data: { collectionId, propertyId, visible },
      });
    }
  }

  /* ------------------- ROWS (CollectionItem) + values ------------------- */

  static async addItem(projectId: string, collectionId: string, title = "Untitled") {
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, document: { projectId }, type: "table" },
      select: { id: true, createdById: true },
    });
    if (!collection) throw { code: "NOT_FOUND", message: "Collection not found" };

    const doc = await prisma.document.create({
      data: {
        projectId,
        title,
        content: {},
        createdById: collection.createdById,
      },
    });

    const position = await this.nextPosition(collectionId);

    const item = await prisma.collectionItem.create({
      data: {
        collectionId,
        documentId: doc.id,
        addedById: collection.createdById,
        position,
      },
    });

    return { document: doc, item };
  }

  static async listItems(projectId: string, collectionId: string, q: ListItemsQuery) {
    const limit = q.limit ?? 25;
    const sort = q.sort ?? "createdAt";
    const dir = q.dir ?? "desc";
    const includeProps = q.includeProperties ?? true;
    const search = q.search?.trim();

    const visibleProps = await prisma.viewPropertyVisibility.findMany({
      where: { collectionId, visible: true },
      select: { propertyId: true },
    });
    const propertyIds = visibleProps.map(v => v.propertyId);

    const where: Prisma.CollectionItemWhereInput = {
      collectionId,
      document: search ? { title: { contains: search, mode: "insensitive" } } : undefined,
    };

    const orderBy: Prisma.CollectionItemOrderByWithRelationInput[] = [];
    if (sort === "title") orderBy.push({ document: { title: dir } as any });
    if (sort === "createdAt") orderBy.push({ document: { createdAt: dir } as any });
    if (sort === "updatedAt") orderBy.push({ document: { updatedAt: dir } as any });

    const rows = await prisma.collectionItem.findMany({
      where,
      take: limit,
      skip: q.cursor ? 1 : 0,
      cursor: q.cursor ? { collectionId_documentId: { collectionId, documentId: q.cursor } } : undefined,
      orderBy: orderBy.length ? orderBy : [{ position: "asc" }],
      include: {
        document: true,
        ...(includeProps
          ? {
              documentPropertyValues: {
                where: { propertyId: { in: propertyIds } },
                include: { property: true, option: true },
              },
            }
          : {}),
      },
    });

    const nextCursor = rows.length === limit ? rows[rows.length - 1].documentId : null;

    return { items: rows, nextCursor, visiblePropertyIds: propertyIds };
  }

  static async patchItem(_projectId: string, collectionId: string, docId: string, patch: { position?: number | null }) {
    const data: Prisma.CollectionItemUpdateInput = {};
    if (patch.position !== undefined) data.position = patch.position;

    await prisma.collectionItem.update({
      where: { collectionId_documentId: { collectionId, documentId: docId } },
      data,
    });

    return { ok: true };
  }

  static async removeItem(_projectId: string, collectionId: string, docId: string) {
    await prisma.collectionItem.delete({
      where: { collectionId_documentId: { collectionId, documentId: docId } },
    });
    return { ok: true };
  }

  static async patchItemValues(
    _projectId: string,
    _collectionId: string,
    documentId: string,
    updates: Array<{ propertyId: string; value: any }>
  ) {
    await prisma.$transaction(async (tx) => {
      for (const u of updates) {
        await this.setPropertyValueTx(tx, documentId, u.propertyId, u.value);
      }
    });
    return { ok: true };
  }

  /* ----------------------------- Internals ----------------------------- */

  private static async nextPosition(collectionId: string) {
    const last = await prisma.collectionItem.findFirst({
      where: { collectionId },
      select: { position: true },
      orderBy: { position: "desc" },
    });
    return (last?.position ?? 0) + 1;
  }

  private static async setPropertyValueTx(
    tx: Prisma.TransactionClient ,
    documentId: string,
    propertyId: string,
    value: any
  ) {
  const prop = await tx.propertyDefinition.findUnique({ where: { id: propertyId } });
  if (!prop) throw { code: "NOT_FOUND", message: "Property not found" };

  const existing = await tx.documentPropertyValue.findFirst({
    where: { documentId, propertyId },
  });

  // helper: coerce to the JSON union that Prisma expects
  const toDbJson = (v: any): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput =>
    v === null || v === undefined ? Prisma.DbNull : (v as Prisma.InputJsonValue);

  // Build CREATE and UPDATE payloads separately (different Prisma input types)
  let createData: Prisma.DocumentPropertyValueUncheckedCreateInput = {
    documentId,
    propertyId,
    valueString: null,
    valueNumber: null,
    valueBool: null,
    valueDate: null,
    valueJson: Prisma.DbNull, // write DB NULL for JSON on create
    optionId: null,
  };

  let updateData: Prisma.DocumentPropertyValueUncheckedUpdateInput = {
    updatedAt: new Date(),
    valueString: null,
    valueNumber: null,
    valueBool: null,
    valueDate: null,
    valueJson: Prisma.DbNull, // write DB NULL for JSON on update
    optionId: null,
  };

  switch (prop.type) {
    case "text":
    case "email": {
      const v = (value ?? null) as string | null;
      createData.valueString = v;
      updateData.valueString = v;
      break;
    }
    case "number": {
      const v = value === null || value === undefined ? null : Number(value);
      createData.valueNumber = v;
      updateData.valueNumber = v;
      break;
    }
    case "checkbox": {
      const v = (value ?? null) as boolean | null;
      createData.valueBool = v;
      updateData.valueBool = v;
      break;
    }
    case "date": {
      const v = value ? new Date(value) : null;
      createData.valueDate = v;
      updateData.valueDate = v;
      break;
    }
    case "multi_select":
    case "person":
    case "file": {
      const j = toDbJson(value);
      createData.valueJson = j;
      updateData.valueJson = j;
      break;
    }
    case "select":
    case "status": {
      // expects PropertyOption.id
      const v = (value ?? null) as string | null;
      createData.optionId = v;
      updateData.optionId = v;
      break;
    }
    default: {
      const j = toDbJson(value);
      createData.valueJson = j;
      updateData.valueJson = j;
    }
  }

  if (existing) {
    await tx.documentPropertyValue.update({
      where: { id: existing.id },
      data: updateData,
    });
    } else {
      await tx.documentPropertyValue.create({
        data: createData,
      });
    }
  }
}
