export type Id = string;
export type ColumnDTO = {
  id: Id;
  label: string;
  position: number | null;
  optionId?: Id;
};

export type CardDTO = {
  id: Id;
  documentId: Id;
  title: string;
  description?: string | null;
  columnId: Id;
  position?: number | null;
};
export type BoardSummary = {
  id: Id;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};
export type BoardSnapshotBase = {
  id: Id;
  name: string;
  description?: string | null;
  columns: ColumnDTO[];
  cards: CardDTO[];
};

export type TaskBoardSnapshot = BoardSnapshotBase & {
  bindings: { statusPropertyId: Id };
};
export type CollectionBoardSnapshot = BoardSnapshotBase & {
  collectionId: Id;
  grouping: { propertyId: Id | null; name: string | null };
};
export type StatusPropertyChoice = {
  id: Id;
  name: string;
  totalDocs: number;
  usedInDocs: number;
};
