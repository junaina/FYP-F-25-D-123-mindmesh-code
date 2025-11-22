// src/modules/board/dto/index.ts
import { z } from "zod";

/* ---------- shared board DTOs ---------- */

export const boardColumnSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  position: z.number().int().nullable(),
});

export const boardCardSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  columnId: z.string().uuid().nullable(),
  position: z.number().int().nullable(),
  assigneeIds: z.array(z.string().uuid()),
});

export const boardSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  hostDocumentId: z.string().uuid(),
  statusPropertyId: z.string().uuid().nullable(),
  columns: z.array(boardColumnSchema),
  cards: z.array(boardCardSchema),
});

export type BoardDto = z.infer<typeof boardSchema>;

/* ---------- body for POST /collections/board (create board) ---------- */

export const createBoardForDocDto = z.object({
  name: z.string().min(1).max(200),
  // kept for compatibility with your route, but ignored in service logic
  allowExisting: z.boolean().optional(),
});

/* ---------- (future) column/card DTOs (can stay for later) ---------- */

export const createColumnDto = z.object({
  title: z.string().min(1).max(100),
});

export const renameColumnDto = z.object({
  columnId: z.string().uuid(),
  title: z.string().min(1).max(100),
});

export const reorderColumnsDto = z.object({
  columnIds: z.array(z.string().uuid()),
});

export const createCardDto = z.object({
  columnId: z.string().uuid().nullable(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
});

export const updateCardDto = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  assigneeIds: z.array(z.string().uuid()).optional(),
});

export const moveCardDto = z.object({
  cardId: z.string().uuid(),
  toColumnId: z.string().uuid().nullable(),
  afterCardId: z.string().uuid().nullable().optional(),
});

/**
 * Body for: POST
 * /api/projects/[projectId]/docs/[docId]/collections/[collectionId]/board/property
 *
 * - name: name of the status property (e.g. "Status", "QA Status")
 * - options: optional list of option labels; 0..N
 */
export const createBoardPropertyDto = z.object({
  name: z.string().min(1).max(100),
  options: z.array(z.string().min(1).max(100)).optional(),
});

export type CreateBoardPropertyDto = z.infer<typeof createBoardPropertyDto>;
export const boardPropertyOptionSchema = z.object({
  id: z.string().uuid(),
  value: z.string(),
  position: z.number().int().nullable(),
  color: z.string().nullable(),
});

export const boardPropertySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.string(),
  options: z.array(boardPropertyOptionSchema),
});
export type BoardPropertyDto = z.infer<typeof boardPropertySchema>;

/**
 * Body for:
 * POST /.../board/property/[propertyId]/options
 *
 * options: array of option labels to add.
 * - can be empty (we'll just no-op)
 */
export const createBoardPropertyOptionsDto = z.object({
  options: z.array(z.string().min(1).max(100)).default([]),
});

export type CreateBoardPropertyOptionsDto = z.infer<
  typeof createBoardPropertyOptionsDto
>;
/**
 * Body for:
 * POST /api/projects/[projectId]/docs/[docId]/collections/[collectionId]/board/items
 *
 * - propertyId: status property the board is organised by right now
 * - optionId: backlog/column (PropertyOption.id) the item belongs to
 * - title: optional document title (defaults to "Untitled")
 */
export const createBoardItemDto = z.object({
  propertyId: z.string().uuid(),
  optionId: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
});

export type CreateBoardItemDto = z.infer<typeof createBoardItemDto>;
export const UpdateBoardItemDto = z.object({
  title: z.string().optional(),
  optionId: z.string().uuid().optional(),
  position: z.number().int().min(0).optional(),
});

export type UpdateBoardItemDto = z.infer<typeof UpdateBoardItemDto>;
export const updateBoardColumnDto = z
  .object({
    value: z.string().min(1).max(255).optional(), // new column label
    color: z.string().min(1).max(64).optional(), // tailwind token / hex / whatever you use
  })
  .refine((data) => data.value !== undefined || data.color !== undefined, {
    message: "At least one of value or color must be provided",
  });

export type UpdateBoardColumnDto = z.infer<typeof updateBoardColumnDto>;
export const reorderBoardColumnsDto = z.object({
  order: z.array(z.string().uuid()),
});

export type ReorderBoardColumnsDto = z.infer<typeof reorderBoardColumnsDto>;
export const updateBoardDto = z.object({
  // currently only name, but easy to extend later with view settings
  name: z.string().min(1).max(255).optional(),
});

export type UpdateBoardDto = z.infer<typeof updateBoardDto>;

export const updateBoardStatusBindingDto = z.object({
  // null = “no status property, bare board”
  statusPropertyId: z.string().uuid().nullable(),
});

export type UpdateBoardStatusBindingDto = z.infer<
  typeof updateBoardStatusBindingDto
>;

export const boardStatusPropertySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.string(), // always "status"
});

export type BoardStatusPropertyDto = z.infer<typeof boardStatusPropertySchema>;

export const boardStatusPropertiesSchema = z.object({
  currentPropertyId: z.string().uuid().nullable(),
  properties: z.array(boardStatusPropertySchema),
});

export type BoardStatusPropertiesDto = z.infer<
  typeof boardStatusPropertiesSchema
>;
