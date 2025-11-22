// src/modules/board/service/board.service.ts

import type {
  Board,
  BoardProperty,
  BoardCard,
  BoardColumn,
  BoardStatusProperty,
} from "../domain/types/board.types";
import {
  findBoardByCollectionId,
  findBoardForDocument,
  createBoardForDocument,
  createStatusPropertyForBoard as createStatusPropertyForBoardRepo,
  addOptionsToPropertyForBoard as addOptionsToPropertyForBoardRepo,
  createBoardItemRepo,
  updateBoardItemRepo,
  deleteBoardItemRepo,
  updateBoardOptionRepo,
  deleteBoardOptionRepo,
  reorderBoardOptionsRepo,
  updateBoardRepo,
  updateBoardStatusBindingRepo,
  deleteBoardRepo,
  findBoardsForDocument,
  listStatusPropertiesForBoardRepo,
  getBoardPropertyWithOptionsRepo,
} from "../repo/board.repo";

/* --------------------------- single board ---------------------------- */

export async function getBoard(collectionId: string): Promise<Board> {
  const board = await findBoardByCollectionId(collectionId);
  if (!board) {
    throw new Error("Board not found");
  }
  return board;
}

/* ------------------------ boards from document ----------------------- */

export async function getBoardForDocument(
  docId: string
): Promise<Board | null> {
  return findBoardForDocument(docId);
}

/* ------------------------ create board in doc ------------------------ */

export async function createBoardInDocument(opts: {
  hostDocumentId: string;
  userId: string;
  name: string;
  allowExisting?: boolean; // accepted but ignored now
}): Promise<Board> {
  const { hostDocumentId, userId, name } = opts;

  // MULTIPLE boards per doc allowed: always create a new one
  const board = await createBoardForDocument({
    hostDocumentId,
    userId,
    name,
  });

  return board;
}

export async function createStatusPropertyForBoardService(opts: {
  collectionId: string; // board = Collection.id
  name: string;
  optionLabels: string[];
}): Promise<BoardProperty> {
  const { collectionId, name, optionLabels } = opts;

  // No “one per board” rule – always create a new status property
  return createStatusPropertyForBoardRepo({
    collectionId,
    name,
    optionLabels,
  });
}

/* ------------------------------------------------------------------ */
/* NEW: add options (backlogs) to a status property for a board       */
/* ------------------------------------------------------------------ */

export async function addOptionsToBoardPropertyService(opts: {
  collectionId: string;
  propertyId: string;
  optionLabels: string[];
}): Promise<BoardProperty> {
  const { collectionId, propertyId, optionLabels } = opts;

  // No uniqueness rule – this simply appends options to that property
  const property = await addOptionsToPropertyForBoardRepo({
    collectionId,
    propertyId,
    optionLabels,
  });

  return property;
}
/* ------------------------------------------------------------------ */
/* NEW: create a card on a board                                      */
/* ------------------------------------------------------------------ */

export async function createBoardItemService(opts: {
  projectId: string;
  docId: string;
  collectionId: string;
  propertyId: string;
  optionId: string;
  title: string;
  userId: string;
}): Promise<BoardCard> {
  const card = await createBoardItemRepo(opts);
  return card;
}

export async function updateBoardItemService(opts: {
  projectId: string;
  docId: string;
  collectionId: string;
  documentId: string;
  title?: string;
  optionId?: string;
  position?: number;
}): Promise<BoardCard> {
  return updateBoardItemRepo(opts);
}
export async function deleteBoardItemService(opts: {
  projectId: string;
  docId: string;
  collectionId: string;
  documentId: string;
  hardDeleteDocument?: boolean;
}): Promise<void> {
  await deleteBoardItemRepo(opts);
}
export async function updateBoardColumnService(opts: {
  projectId: string;
  docId: string;
  collectionId: string;
  propertyId: string;
  optionId: string;
  value?: string;
  color?: string;
}): Promise<BoardColumn> {
  return updateBoardOptionRepo(opts);
}
export async function deleteBoardColumnService(opts: {
  projectId: string;
  docId: string;
  collectionId: string;
  propertyId: string;
  optionId: string;
  hardDeleteItems?: boolean;
}): Promise<void> {
  await deleteBoardOptionRepo(opts);
}

export async function reorderBoardColumnsService(opts: {
  projectId: string;
  docId: string;
  collectionId: string;
  propertyId: string;
  order: string[];
}): Promise<BoardColumn[]> {
  return reorderBoardOptionsRepo(opts);
}
export async function updateBoardService(opts: {
  projectId: string;
  docId: string;
  collectionId: string;
  name?: string;
}): Promise<Board> {
  return updateBoardRepo(opts);
}

export async function updateBoardStatusBindingService(opts: {
  projectId: string;
  docId: string;
  collectionId: string;
  statusPropertyId: string | null;
}): Promise<Board> {
  return updateBoardStatusBindingRepo(opts);
}

export async function deleteBoardService(opts: {
  projectId: string;
  docId: string;
  collectionId: string;
}): Promise<void> {
  await deleteBoardRepo(opts);
}
export async function listBoardItemsService(
  collectionId: string
): Promise<BoardCard[]> {
  const board = await findBoardByCollectionId(collectionId);

  if (!board) {
    throw new Error("board not found");
  }

  return board.cards;
}
export async function getBoardsForDocument(docId: string): Promise<Board[]> {
  return findBoardsForDocument(docId);
}

export async function getBoardStatusPropertiesService(opts: {
  projectId: string;
  docId: string;
  collectionId: string;
}): Promise<{
  currentPropertyId: string | null;
  properties: BoardStatusProperty[];
}> {
  return listStatusPropertiesForBoardRepo(opts);
}

/* ------------------- property + options for board ------------------- */

export async function getBoardPropertyWithOptionsService(opts: {
  projectId: string;
  docId: string;
  collectionId: string;
  propertyId: string;
}): Promise<BoardProperty> {
  return getBoardPropertyWithOptionsRepo(opts);
}
