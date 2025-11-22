// src/modules/board/domain/types.ts

export type BoardColumn = {
  id: string; // PropertyOption.id
  title: string;
  position: number | null; // PropertyOption.position
};

export type BoardCard = {
  id: string; // Document.id
  title: string;
  description: string | null;
  columnId: string | null; // PropertyOption.id (status option) or null
  position: number | null; // CollectionItem.position
  assigneeIds: string[]; // future: property / collaborators
};

export type Board = {
  id: string; // Collection.id
  name: string; // Collection.name
  hostDocumentId: string; // Collection.documentId
  statusPropertyId: string | null; // PropertyDefinition.id or null
  columns: BoardColumn[]; // derived from PropertyOption rows
  cards: BoardCard[]; // derived from CollectionItem + Document
};
/* -------- NEW: Board property model (status-type property) ---------- */

export type BoardPropertyOption = {
  id: string; // PropertyOption.id
  value: string; // PropertyOption.value
  position: number | null; // PropertyOption.position
  color: string | null; // PropertyOption.color
};

export type BoardProperty = {
  id: string; // PropertyDefinition.id
  name: string; // PropertyDefinition.name
  type: string; // PropertyDefinition.type (we’ll use "status")
  options: BoardPropertyOption[]; // 0..N options
};
export interface UpdateBoardItemInput {
  documentId: string;
  collectionId: string;
  projectId: string;
  title?: string;
  optionId?: string;
  position?: number;
}
export type BoardStatusProperty = {
  id: string;
  name: string;
  type: string; // "status"
};
