// src/modules/board/repo/board.repo.ts

import { prisma } from "@/lib/prisma";
import type {
  Board,
  BoardCard,
  BoardColumn,
  BoardProperty,
  BoardPropertyOption,
  BoardStatusProperty,
} from "../domain/types/board.types";
const EMPTY_TIPTAP_DOC = { type: "doc", content: [] as any[] };
function encodeBoardType(statusPropertyId?: string | null) {
  return statusPropertyId ? `board:status:${statusPropertyId}` : "board";
}

function decodeBoardType(type: string | null): string | null {
  if (!type || type === "board") return null;
  const [prefix, kind, propId] = type.split(":");
  if (prefix === "board" && kind === "status" && propId) return propId;
  return null;
}

/* ------------------------------------------------------------------ */
/* Load a board by collectionId                                       */
/* ------------------------------------------------------------------ */

export async function findBoardByCollectionId(
  collectionId: string
): Promise<Board | null> {
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    include: { document: true },
  });

  if (!collection) return null;

  const statusPropertyId = decodeBoardType(collection.type);

  // CASE 1: bare board – no status property yet
  if (!statusPropertyId) {
    const board: Board = {
      id: collection.id,
      name: collection.name,
      hostDocumentId: collection.documentId,
      statusPropertyId: null,
      columns: [],
      cards: [],
    };
    return board;
  }

  // CASE 2: board bound to a status property
  const [statusProperty, items] = await Promise.all([
    prisma.propertyDefinition.findUnique({
      where: { id: statusPropertyId },
      include: {
        options: {
          orderBy: [{ position: "asc" }, { value: "asc" }],
        },
      },
    }),
    prisma.collectionItem.findMany({
      where: { collectionId },
      include: {
        document: {
          include: {
            propertyValues: {
              where: { propertyId: statusPropertyId },
              include: { option: true },
            },
          },
        },
      },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  if (!statusProperty) {
    // Property was deleted; treat as bare board
    return {
      id: collection.id,
      name: collection.name,
      hostDocumentId: collection.documentId,
      statusPropertyId: null,
      columns: [],
      cards: [],
    };
  }

  const columns: BoardColumn[] = statusProperty.options.map((opt) => ({
    id: opt.id,
    title: opt.value,
    position: opt.position ?? null,
  }));

  const cards: BoardCard[] = items.map((item) => {
    const doc = item.document;
    const statusVal = doc.propertyValues[0];
    return {
      id: doc.id,
      title: doc.title,
      description: doc.description ?? null,
      columnId: statusVal?.optionId ?? null,
      position: item.position,
      assigneeIds: [],
    };
  });

  return {
    id: collection.id,
    name: collection.name,
    hostDocumentId: collection.documentId,
    statusPropertyId,
    columns,
    cards,
  };
}

/* ------------------------------------------------------------------ */
/* Create a new board for a document                                  */
/* ------------------------------------------------------------------ */

export async function createBoardForDocument(opts: {
  hostDocumentId: string;
  userId: string;
  name: string;
}): Promise<Board> {
  const { hostDocumentId, userId, name } = opts;

  // MULTIPLE boards per doc are allowed; always create a new Collection
  const collection = await prisma.collection.create({
    data: {
      documentId: hostDocumentId,
      name,
      type: encodeBoardType(null), // "board"
      createdById: userId,
    },
  });

  const board: Board = {
    id: collection.id,
    name: collection.name,
    hostDocumentId,
    statusPropertyId: null,
    columns: [],
    cards: [],
  };

  return board;
}

/* ------------------------------------------------------------------ */
/* Boards for a given document (used by GET /collections/board)       */
/* ------------------------------------------------------------------ */

async function findBoardCollectionsForDocument(docId: string) {
  return prisma.collection.findMany({
    where: {
      documentId: docId,
      type: { startsWith: "board" },
    },
    orderBy: { createdAt: "asc" },
  });
}
export async function findBoardsForDocument(docId: string): Promise<Board[]> {
  const collections = await findBoardCollectionsForDocument(docId);
  if (!collections.length) return [];

  const boards = await Promise.all(
    collections.map((c) => findBoardByCollectionId(c.id))
  );

  // filter out any nulls, just in case
  return boards.filter((b): b is Board => Boolean(b));
}

// Currently used as "get first board for this doc" – you can later add
// a service that returns all boards if needed.
export async function findBoardForDocument(
  docId: string
): Promise<Board | null> {
  const collections = await findBoardCollectionsForDocument(docId);
  if (!collections.length) return null;

  return findBoardByCollectionId(collections[0].id);
}

/* ------------------------------------------------------------------ */
/* NEW: create a status PropertyDefinition + options for a board      */
/* ------------------------------------------------------------------ */

export async function createStatusPropertyForBoard(opts: {
  collectionId: string; // board = Collection.id
  name: string; // property name, e.g. "Status"
  optionLabels: string[]; // backlog column labels, 0..N
}): Promise<BoardProperty> {
  const { collectionId, name, optionLabels } = opts;

  return prisma.$transaction(async (tx) => {
    // 1) find the board's collection + project
    const collection = await tx.collection.findUnique({
      where: { id: collectionId },
      include: { document: true },
    });

    if (!collection) {
      throw new Error("Board collection not found");
    }

    const projectId = collection.document.projectId;

    // 2) create PropertyDefinition of type "status" with options
    const property = await tx.propertyDefinition.create({
      data: {
        projectId,
        name,
        type: "status", // <--- status type
        options: optionLabels.length
          ? {
              create: optionLabels.map((value, idx) => ({
                value,
                position: idx,
              })),
            }
          : undefined,
      },
      include: { options: true },
    });

    // 3) make it visible in this board view
    await tx.viewPropertyVisibility.create({
      data: {
        collectionId,
        propertyId: property.id,
        visible: true,
      },
    });

    // 4) map to BoardProperty domain type
    const options: BoardPropertyOption[] = property.options.map((opt) => ({
      id: opt.id,
      value: opt.value,
      position: opt.position ?? null,
      color: opt.color ?? null,
    }));

    const boardProperty: BoardProperty = {
      id: property.id,
      name: property.name,
      type: property.type,
      options,
    };

    return boardProperty;
  });
}
/* ------------------------------------------------------------------ */
/* NEW: add options to an existing status property for a board        */
/* ------------------------------------------------------------------ */

export async function addOptionsToPropertyForBoard(opts: {
  collectionId: string; // board = Collection.id
  propertyId: string; // PropertyDefinition.id
  optionLabels: string[]; // labels to add (0..N)
}): Promise<BoardProperty> {
  const { collectionId, propertyId, optionLabels } = opts;

  return prisma.$transaction(async (tx) => {
    // 1) ensure board collection + doc exist
    const collection = await tx.collection.findUnique({
      where: { id: collectionId },
      include: { document: true },
    });
    if (!collection) {
      throw new Error("Board collection not found");
    }

    // 2) load property & make sure it's in same project
    const property = await tx.propertyDefinition.findUnique({
      where: { id: propertyId },
      include: {
        options: {
          orderBy: [{ position: "asc" }, { value: "asc" }],
        },
      },
    });

    if (!property) {
      throw new Error("Property not found");
    }

    if (property.projectId !== collection.document.projectId) {
      throw new Error("Property belongs to a different project");
    }

    // 3) ensure it's visible in this board view (if not, create vis row)
    const existingVisibility = await tx.viewPropertyVisibility.findFirst({
      where: {
        collectionId,
        propertyId,
      },
    });

    if (!existingVisibility) {
      await tx.viewPropertyVisibility.create({
        data: {
          collectionId,
          propertyId,
          visible: true,
        },
      });
    }

    // 4) if no options passed, just return current property
    if (!optionLabels.length) {
      const options: BoardPropertyOption[] = property.options.map((opt) => ({
        id: opt.id,
        value: opt.value,
        position: opt.position ?? null,
        color: opt.color ?? null,
      }));

      return {
        id: property.id,
        name: property.name,
        type: property.type,
        options,
      };
    }

    // 5) figure out starting position for new options
    const maxPosition =
      property.options.reduce(
        (max, opt) =>
          opt.position != null && opt.position > max ? opt.position : max,
        -1
      ) ?? -1;

    // 6) create new options
    await Promise.all(
      optionLabels.map((value, idx) =>
        tx.propertyOption.create({
          data: {
            propertyId: property.id,
            value,
            position: maxPosition + idx + 1,
          },
        })
      )
    );

    // 7) reload property with all options
    const updated = await tx.propertyDefinition.findUnique({
      where: { id: property.id },
      include: {
        options: {
          orderBy: [{ position: "asc" }, { value: "asc" }],
        },
      },
    });

    if (!updated) {
      throw new Error("Failed to reload property");
    }

    const updatedOptions: BoardPropertyOption[] = updated.options.map(
      (opt) => ({
        id: opt.id,
        value: opt.value,
        position: opt.position ?? null,
        color: opt.color ?? null,
      })
    );

    const boardProperty: BoardProperty = {
      id: updated.id,
      name: updated.name,
      type: updated.type,
      options: updatedOptions,
    };

    return boardProperty;
  });
}
/* ------------------------------------------------------------------ */
/* Helper: ensure this collection is a board for the given doc/project */
/* ------------------------------------------------------------------ */

async function assertBoardCollection(params: {
  projectId: string;
  docId: string;
  collectionId: string;
}) {
  const { projectId, docId, collectionId } = params;

  const row = await prisma.collection.findFirst({
    where: {
      id: collectionId,
      documentId: docId,
      type: { startsWith: "board" },
      document: { projectId },
    },
    select: { id: true, documentId: true },
  });

  if (!row) {
    throw new Error("board collection not found for this document/project");
  }

  return row;
}

export async function createBoardItemRepo(opts: {
  projectId: string;
  docId: string;
  collectionId: string; // board = Collection.id
  propertyId: string; // status PropertyDefinition.id
  optionId: string; // PropertyOption.id (backlog/column)
  title: string;
  userId: string;
}): Promise<BoardCard> {
  const {
    projectId,
    docId,
    collectionId,
    propertyId,
    optionId,
    title,
    userId,
  } = opts;

  return prisma.$transaction(
    async (tx) => {
      // 1) ensure this collection is a board on this doc/project
      const collection = await tx.collection.findFirst({
        where: {
          id: collectionId,
          documentId: docId,
          type: { startsWith: "board" },
          document: { projectId },
        },
        select: { id: true, documentId: true },
      });

      if (!collection) {
        throw new Error("board collection not found for this document/project");
      }

      // 2) verify property + option belong to this project/property
      const property = await tx.propertyDefinition.findFirst({
        where: { id: propertyId, projectId },
        select: { id: true, type: true },
      });

      if (!property) {
        throw new Error("property not found for this project");
      }
      if (property.type !== "status") {
        throw new Error(
          "property must be of type 'status' to use as board column"
        );
      }

      const option = await tx.propertyOption.findFirst({
        where: { id: optionId, propertyId },
        select: { id: true },
      });

      if (!option) {
        throw new Error("option not found for this property");
      }

      // 3) create document for the card
      const doc = await tx.document.create({
        data: {
          projectId,
          title: title.trim().slice(0, 255),
          content: EMPTY_TIPTAP_DOC,
          createdById: userId,
        },
        select: {
          id: true,
          title: true,
          description: true,
        },
      });

      // 4) compute next position in this collection
      const lastItem = await tx.collectionItem.findFirst({
        where: { collectionId },
        orderBy: { position: "desc" },
        select: { position: true },
      });

      const nextPosition = (lastItem?.position ?? 0) + 1;

      // 5) link doc → collection as CollectionItem
      const item = await tx.collectionItem.create({
        data: {
          collectionId,
          documentId: doc.id,
          addedById: userId,
          position: nextPosition,
        },
        select: { position: true },
      });

      // 6) ensure doc has the status property
      await tx.documentProperty.upsert({
        where: {
          documentId_propertyId: {
            documentId: doc.id,
            propertyId,
          },
        },
        update: {},
        create: {
          documentId: doc.id,
          propertyId,
        },
      });

      // 7) set the value for that status property to this option
      await tx.documentPropertyValue.upsert({
        where: {
          documentId_propertyId: {
            documentId: doc.id,
            propertyId,
          },
        },
        update: {
          optionId,
          valueString: null,
          valueNumber: null,
          valueBool: null,
          valueDate: null,
          valueJson: undefined,
        },
        create: {
          documentId: doc.id,
          propertyId,
          optionId,
        },
      });

      // 8) map to BoardCard domain type
      const card: BoardCard = {
        id: doc.id,
        title: doc.title,
        description: doc.description ?? null,
        columnId: optionId,
        position: item.position,
        assigneeIds: [],
      };

      return card;
    },
    {
      maxWait: 10_000,
      timeout: 20_000,
    }
  );
}
export async function updateBoardItemRepo(opts: {
  projectId: string;
  docId: string;
  collectionId: string;
  documentId: string;
  title?: string;
  optionId?: string; // target column
  position?: number; // target index within that column
}): Promise<BoardCard> {
  const {
    projectId,
    docId,
    collectionId,
    documentId,
    title,
    optionId,
    position,
  } = opts;

  // 1) ensure this collection is a board on this doc/project
  await assertBoardCollection({ projectId, docId, collectionId });

  // 2) load the collection item + doc
  const item = await prisma.collectionItem.findUnique({
    where: {
      collectionId_documentId: {
        collectionId,
        documentId,
      },
    },
    include: {
      document: {
        select: {
          id: true,
          title: true,
          description: true,
        },
      },
    },
  });

  if (!item) {
    throw new Error("card not found in this board");
  }

  // 3) rename document if title provided
  if (typeof title === "string") {
    const trimmed = title.trim().slice(0, 255);
    if (trimmed && trimmed !== item.document.title) {
      await prisma.document.update({
        where: { id: documentId },
        data: { title: trimmed },
      });
    }
  }

  let propertyId: string | null = null;
  let targetOptionId: string | null = null;

  // 4) if optionId provided → move card to that column
  if (typeof optionId === "string") {
    const option = await prisma.propertyOption.findUnique({
      where: { id: optionId },
      include: {
        property: {
          select: { id: true, projectId: true, type: true },
        },
      },
    });

    if (!option || !option.property) {
      throw new Error("target column (option) not found");
    }
    if (option.property.projectId !== projectId) {
      throw new Error("option does not belong to this project");
    }
    if (option.property.type !== "status") {
      throw new Error("option must belong to a status property");
    }

    propertyId = option.property.id;
    targetOptionId = optionId;

    // ensure doc has that status property
    await prisma.documentProperty.upsert({
      where: {
        documentId_propertyId: {
          documentId,
          propertyId,
        },
      },
      update: {},
      create: {
        documentId,
        propertyId,
      },
    });

    // set the value for that status property
    await prisma.documentPropertyValue.upsert({
      where: {
        documentId_propertyId: {
          documentId,
          propertyId,
        },
      },
      update: {
        optionId,
        valueString: null,
        valueNumber: null,
        valueBool: null,
        valueDate: null,
        valueJson: undefined,
      },
      create: {
        documentId,
        propertyId,
        optionId,
      },
    });
  }

  // 5) re-order inside the column (if requested)
  if (position != null) {
    if (!targetOptionId || !propertyId) {
      // we depend on optionId to know which column to reorder in
      throw new Error("position requires optionId");
    }

    // all items currently in that column
    const itemsInColumn = await prisma.collectionItem.findMany({
      where: {
        collectionId,
        document: {
          propertyValues: {
            some: {
              propertyId,
              optionId: targetOptionId,
            },
          },
        },
      },
      include: {
        document: { select: { id: true } },
      },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    });

    // build new order of docIds for that column
    const otherIds = itemsInColumn
      .filter((ci) => ci.documentId !== documentId)
      .map((ci) => ci.documentId);

    const clampedIndex = Math.max(0, Math.min(position, otherIds.length));

    const newOrder = [
      ...otherIds.slice(0, clampedIndex),
      documentId,
      ...otherIds.slice(clampedIndex),
    ];

    // write positions back
    await Promise.all(
      newOrder.map((docId, idx) =>
        prisma.collectionItem.update({
          where: {
            collectionId_documentId: {
              collectionId,
              documentId: docId,
            },
          },
          data: { position: idx + 1 },
        })
      )
    );
  }

  // 6) reload final state of the card
  const final = await prisma.collectionItem.findUnique({
    where: {
      collectionId_documentId: {
        collectionId,
        documentId,
      },
    },
    include: {
      document: {
        include: {
          propertyValues: true,
        },
      },
    },
  });

  if (!final) {
    throw new Error("failed to reload card");
  }

  // find status-like value (if any)
  const statusVal = final.document.propertyValues.find(
    (pv) => pv.optionId != null
  );

  const card: BoardCard = {
    id: final.documentId,
    title: final.document.title,
    description: final.document.description ?? null,
    columnId: statusVal?.optionId ?? null,
    position: final.position,
    assigneeIds: [],
  };

  return card;
}
export async function deleteBoardItemRepo(opts: {
  projectId: string;
  docId: string;
  collectionId: string;
  documentId: string;
  hardDeleteDocument?: boolean; // default: archive instead of hard delete
}): Promise<void> {
  const {
    projectId,
    docId,
    collectionId,
    documentId,
    hardDeleteDocument = false,
  } = opts;

  // 1) ensure this collection is a board on this doc/project
  await assertBoardCollection({ projectId, docId, collectionId });

  // 2) load the collection item + document
  const item = await prisma.collectionItem.findUnique({
    where: {
      collectionId_documentId: {
        collectionId,
        documentId,
      },
    },
    include: {
      document: true,
    },
  });

  if (!item) {
    throw new Error("card not found in this board");
  }

  if (item.document.projectId !== projectId) {
    throw new Error("card belongs to a different project");
  }

  // 3) remove the card from this board
  await prisma.collectionItem.delete({
    where: {
      collectionId_documentId: {
        collectionId,
        documentId,
      },
    },
  });

  // 4) what to do with the underlying document?
  if (hardDeleteDocument) {
    // hard delete document – cascades remove property values, etc.
    await prisma.document.delete({
      where: { id: documentId },
    });
  } else {
    // soft delete: archive the document but keep it in the system
    if (!item.document.isArchived) {
      await prisma.document.update({
        where: { id: documentId },
        data: { isArchived: true },
      });
    }
  }
}
export async function updateBoardOptionRepo(opts: {
  projectId: string;
  docId: string;
  collectionId: string;
  propertyId: string;
  optionId: string;
  value?: string;
  color?: string;
}): Promise<BoardColumn> {
  const { projectId, docId, collectionId, propertyId, optionId, value, color } =
    opts;

  // 1) ensure this collection is a board on this doc/project
  // we only care that it exists & is a board – no need to read `type`
  await assertBoardCollection({
    projectId,
    docId,
    collectionId,
  });

  // 2) load option + property for validation
  const option = await prisma.propertyOption.findUnique({
    where: { id: optionId },
    include: {
      property: {
        select: { id: true, projectId: true },
      },
    },
  });

  if (!option || !option.property) {
    throw new Error("column (option) not found");
  }

  if (option.property.id !== propertyId) {
    throw new Error("option does not belong to the given property");
  }

  if (option.property.projectId !== projectId) {
    throw new Error("option does not belong to this project");
  }

  // 3) update the option
  const updated = await prisma.propertyOption.update({
    where: { id: optionId },
    data: {
      value: value !== undefined ? value : undefined,
      color: color !== undefined ? color : undefined,
    },
  });

  // 4) map to BoardColumn
  const column: BoardColumn = {
    id: updated.id,
    title: updated.value,
    position: updated.position ?? null,
  };

  return column;
}
export async function deleteBoardOptionRepo(opts: {
  projectId: string;
  docId: string;
  collectionId: string;
  propertyId: string;
  optionId: string;
  hardDeleteItems?: boolean; // default: true
}): Promise<void> {
  const {
    projectId,
    docId,
    collectionId,
    propertyId,
    optionId,
    hardDeleteItems = true,
  } = opts;

  // 1) make sure this collection really is a board on this doc/project
  await assertBoardCollection({ projectId, docId, collectionId });

  // 2) load option + property for validation
  const option = await prisma.propertyOption.findUnique({
    where: { id: optionId },
    include: {
      property: {
        select: { id: true, projectId: true },
      },
    },
  });

  if (!option || !option.property) {
    throw new Error("column (option) not found");
  }

  if (option.property.id !== propertyId) {
    throw new Error("option does not belong to the given property");
  }

  if (option.property.projectId !== projectId) {
    throw new Error("option does not belong to this project");
  }

  // 3) find all cards in THIS board that are in this column
  const itemsInColumn = await prisma.collectionItem.findMany({
    where: {
      collectionId,
      document: {
        propertyValues: {
          some: {
            propertyId,
            optionId,
          },
        },
      },
    },
    select: { documentId: true },
  });

  const docIds = itemsInColumn.map((i) => i.documentId);

  // 4) delete or archive those documents
  if (hardDeleteItems) {
    // hard delete each card's underlying document
    await Promise.all(
      docIds.map((id) =>
        prisma.document.delete({
          where: { id },
        })
      )
    );
  } else {
    // soft delete: remove from board + archive docs
    await Promise.all(
      docIds.map(async (id) => {
        await prisma.collectionItem.delete({
          where: {
            collectionId_documentId: {
              collectionId,
              documentId: id,
            },
          },
        });
        await prisma.document.update({
          where: { id },
          data: { isArchived: true },
        });
      })
    );
  }

  // 5) clear optionId for any remaining property values using this option
  //    (including docs not in this board) to satisfy FK constraints
  await prisma.documentPropertyValue.updateMany({
    where: { propertyId, optionId },
    data: { optionId: null },
  });

  // 6) finally delete the option itself
  await prisma.propertyOption.delete({
    where: { id: optionId },
  });
}
export async function reorderBoardOptionsRepo(opts: {
  projectId: string;
  docId: string;
  collectionId: string;
  propertyId: string;
  order: string[]; // ordered list of PropertyOption.id
}): Promise<BoardColumn[]> {
  const { projectId, docId, collectionId, propertyId, order } = opts;

  // 1) ensure this collection is a board on this doc/project
  await assertBoardCollection({ projectId, docId, collectionId });

  // 2) verify the property belongs to this project
  const property = await prisma.propertyDefinition.findFirst({
    where: { id: propertyId, projectId },
    select: { id: true },
  });

  if (!property) {
    throw new Error("property not found for this project");
  }

  // 3) load all options for this property
  const existingOptions = await prisma.propertyOption.findMany({
    where: { propertyId },
    orderBy: [{ position: "asc" }, { value: "asc" }],
  });

  if (!existingOptions.length) {
    return [];
  }

  // sanity checks: order must exactly match the existing set
  const existingIds = new Set(existingOptions.map((o) => o.id));
  const orderIds = new Set(order);

  if (
    order.length !== existingOptions.length ||
    existingIds.size !== orderIds.size ||
    order.some((id) => !existingIds.has(id))
  ) {
    throw new Error(
      "order must contain all and only this property's option ids"
    );
  }

  // 4) update positions according to the new order
  await Promise.all(
    order.map((id, idx) =>
      prisma.propertyOption.update({
        where: { id },
        data: { position: idx },
      })
    )
  );

  // 5) reload options & map to BoardColumn[]
  const updatedOptions = await prisma.propertyOption.findMany({
    where: { propertyId },
    orderBy: [{ position: "asc" }, { value: "asc" }],
  });

  const columns: BoardColumn[] = updatedOptions.map((opt) => ({
    id: opt.id,
    title: opt.value,
    position: opt.position ?? null,
  }));

  return columns;
}
export async function updateBoardRepo(opts: {
  projectId: string;
  docId: string;
  collectionId: string;
  name?: string;
}): Promise<Board> {
  const { projectId, docId, collectionId, name } = opts;

  // ensure this collection is a board on this doc + project
  await assertBoardCollection({ projectId, docId, collectionId });

  if (typeof name === "string") {
    const trimmed = name.trim().slice(0, 255);
    if (trimmed.length) {
      await prisma.collection.update({
        where: { id: collectionId },
        data: { name: trimmed },
      });
    }
  }

  const board = await findBoardByCollectionId(collectionId);
  if (!board) {
    throw new Error("board not found after update");
  }

  return board;
}

export async function updateBoardStatusBindingRepo(opts: {
  projectId: string;
  docId: string;
  collectionId: string;
  statusPropertyId: string | null;
}): Promise<Board> {
  const { projectId, docId, collectionId, statusPropertyId } = opts;

  // ensure the collection is a board for this doc + project
  await assertBoardCollection({ projectId, docId, collectionId });

  // if provided, validate the new status property
  if (statusPropertyId) {
    const prop = await prisma.propertyDefinition.findFirst({
      where: { id: statusPropertyId, projectId },
      select: { id: true, type: true },
    });

    if (!prop) {
      throw new Error("status property not found for this project");
    }

    if (prop.type !== "status") {
      throw new Error("statusPropertyId must refer to a 'status' property");
    }
  }

  // write the new binding into Collection.type
  await prisma.collection.update({
    where: { id: collectionId },
    data: { type: encodeBoardType(statusPropertyId) },
  });

  const board = await findBoardByCollectionId(collectionId);
  if (!board) {
    throw new Error("board not found after status binding update");
  }

  return board;
}

export async function deleteBoardRepo(opts: {
  projectId: string;
  docId: string;
  collectionId: string;
}): Promise<void> {
  const { projectId, docId, collectionId } = opts;

  // ensure this is a board on that doc/project
  await assertBoardCollection({ projectId, docId, collectionId });

  // Cascade will clean up CollectionItem & ViewPropertyVisibility
  await prisma.collection.delete({
    where: { id: collectionId },
  });
}

export async function listStatusPropertiesForBoardRepo(opts: {
  projectId: string;
  docId: string;
  collectionId: string;
}): Promise<{
  currentPropertyId: string | null;
  properties: BoardStatusProperty[];
}> {
  const { projectId, docId, collectionId } = opts;

  // 1) make sure this collection really is a board on this doc + project
  const collection = await prisma.collection.findFirst({
    where: {
      id: collectionId,
      documentId: docId,
      type: { startsWith: "board" },
      document: { projectId },
    },
    select: {
      id: true,
      type: true,
    },
  });

  if (!collection) {
    throw new Error("board collection not found for this document/project");
  }

  // 2) read the board's current status binding from Collection.type
  const currentPropertyId = decodeBoardType(collection.type);

  // 3) find status properties that are actually attached to THIS board
  //    via ViewPropertyVisibility
  const visibilityRows = await prisma.viewPropertyVisibility.findMany({
    where: {
      collectionId,
      property: {
        projectId,
        type: "status",
      },
    },
    include: {
      property: true,
    },
    orderBy: {
      property: {
        createdAt: "asc",
      },
    },
  });

  let properties: BoardStatusProperty[] = visibilityRows.map((row) => ({
    id: row.property.id,
    name: row.property.name,
    type: row.property.type,
  }));

  // 4) defensive: if the board is bound to a status property that doesn't
  //    currently have a visibility row for this collection, optionally
  //    include it so the dropdown still shows the current value.
  if (
    currentPropertyId &&
    !properties.some((p) => p.id === currentPropertyId)
  ) {
    const current = await prisma.propertyDefinition.findFirst({
      where: { id: currentPropertyId, projectId, type: "status" },
    });

    if (current) {
      properties = [
        {
          id: current.id,
          name: current.name,
          type: current.type,
        },
        ...properties,
      ];
    }
  }

  return { currentPropertyId, properties };
}

/* ------------------------------------------------------------------ */
/* Property + options for this board                                  */
/* ------------------------------------------------------------------ */

export async function getBoardPropertyWithOptionsRepo(opts: {
  projectId: string;
  docId: string;
  collectionId: string;
  propertyId: string;
}): Promise<BoardProperty> {
  const { projectId, docId, collectionId, propertyId } = opts;

  // ensure this is a board attached to that doc/project
  await assertBoardCollection({ projectId, docId, collectionId });

  const property = await prisma.propertyDefinition.findFirst({
    where: { id: propertyId, projectId },
    include: {
      options: {
        orderBy: [{ position: "asc" }, { value: "asc" }],
      },
    },
  });

  if (!property) {
    throw new Error("property not found for this project");
  }

  const result: BoardProperty = {
    id: property.id,
    name: property.name,
    type: property.type,
    options: property.options.map((opt) => ({
      id: opt.id,
      value: opt.value,
      position: opt.position ?? null,
      color: opt.color ?? null,
    })),
  };

  return result;
}
