import { z } from "zod";
export const ColumnDto = z.object({
  id: z.string(),
  label: z.string(),
  position: z.number().nullable(),
  optionId: z.string().optional(),
});
export type ColumnDto = z.infer<typeof ColumnDto>;

export const CardDto = z.object({
  id: z.string(),
  documentId: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  columnId: z.string(),
  position: z.number().nullable().optional(),
});
export type CardDto = z.infer<typeof CardDto>;

export const BoardSummaryDto = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type BoardSummaryDto = z.infer<typeof BoardSummaryDto>;

export const TaskBoardSnapshotDto = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  bindings: z.object({ statusPropertyId: z.string() }),
  columns: z.array(ColumnDto),
  cards: z.array(CardDto),
});
export type TaskBoardSnapshotDto = z.infer<typeof TaskBoardSnapshotDto>;
export const CollectionBoardSnapshotDto = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  collectionId: z.string(),
  grouping: z.object({
    propertyId: z.string().nullable(),
    name: z.string().nullable(),
  }),
  columns: z.array(ColumnDto),
  cards: z.array(CardDto),
});
export type CollectionBoardSnapshotDto = z.infer<
  typeof CollectionBoardSnapshotDto
>;

export const StatusPropertyChoiceDto = z.object({
  id: z.string(),
  name: z.string(),
  totalDocs: z.number(),
  usedInDocs: z.number(),
});
export type StatusPropertyChoiceDto = z.infer<typeof StatusPropertyChoiceDto>;
