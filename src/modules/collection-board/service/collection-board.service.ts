import { CollectionBoardRepo } from "../repo/collection-board.repo";
import {
  BoardSnapshotBase,
  CardDTO,
  CollectionBoardSnapshot,
  ColumnDTO,
  StatusPropertyChoice,
} from "@/modules/board/domain/types";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/https";

export const CollectionBoardService = {
  // Choose a grouping property heuristically: the status property used by the most docs; if tie, any.
  async getBoard(
    projectId: string,
    collectionId: string
  ): Promise<CollectionBoardSnapshot> {
    const col = await CollectionBoardRepo.getCollection(
      projectId,
      collectionId
    );
    if (!col) throw new HttpError(404, "NOT_FOUND", "Collection not found");

    const docIds = await CollectionBoardRepo.listDocIds(collectionId);
    const usage = await CollectionBoardRepo.statusUsageForDocs(
      projectId,
      docIds
    );

    const totalDocs = docIds.length;
    const sorted = usage.sort((a, b) => b.count - a.count);
    const chosen = sorted[0];

    let columns: ColumnDTO[] = [];
    let cards: CardDTO[] = [];
    let grouping = {
      propertyId: null as string | null,
      name: null as string | null,
    };

    if (chosen) {
      const prop = await CollectionBoardRepo.getStatusProperty(
        chosen.propertyId
      );
      if (prop) {
        grouping = { propertyId: prop.id, name: prop.name };
        columns = prop.options.map((o) => ({
          id: o.id,
          label: o.value,
          position: o.position ?? null,
          optionId: o.id,
        }));
        const metas = await CollectionBoardRepo.docsMeta(docIds);
        const values = await CollectionBoardRepo.getPropertyValuesForDocs(
          prop.id,
          docIds
        );
        const byDoc = new Map(values.map((v) => [v.documentId, v.optionId]));
        cards = metas.map((m) => {
          const optId = byDoc.get(m.id) ?? columns[0]?.optionId ?? "";
          // use option id as column id; in UI we will map columnId by optionId for collection board
          const columnId =
            columns.find((c) => c.optionId === optId)?.id ??
            columns[0]?.id ??
            "";
          return {
            id: `${collectionId}:${m.id}`,
            documentId: m.id,
            title: m.title,
            description: m.description,
            columnId,
          };
        });
      }
    }

    return {
      id: col.id,
      name: col.name,
      description: null,
      collectionId: col.id,
      grouping,
      columns,
      cards,
    };
  },

  async getAvailableStatusProperties(
    projectId: string,
    collectionId: string
  ): Promise<StatusPropertyChoice[]> {
    const docIds = await CollectionBoardRepo.listDocIds(collectionId);
    const total = docIds.length;
    // Count per status property
    const usage = await CollectionBoardRepo.statusUsageForDocs(
      projectId,
      docIds
    );
    const props = await prisma.propertyDefinition.findMany({
      where: { id: { in: usage.map((u) => u.propertyId) } },
    });
    return props.map((p) => ({
      id: p.id,
      name: p.name,
      totalDocs: total,
      usedInDocs: usage.find((u) => u.propertyId === p.id)?.count ?? 0,
    }));
  },
};
