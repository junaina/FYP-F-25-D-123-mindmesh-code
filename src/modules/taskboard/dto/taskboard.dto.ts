import { z } from "zod";

export const taskboardBindingsSchema = z.object({
  statusPropertyId: z.string().uuid().nullable().optional(),
});

export const taskboardColumnSchema = z.object({
  optionId: z.string().uuid(),
  label: z.string(),
  value: z.string().optional(),
  position: z.number().int().nullable().optional(),
});

export const taskboardCardSchema = z.object({
  id: z.string().uuid(), // doc id
  documentId: z.string().uuid().optional(),
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  optionId: z.string().uuid().optional(), // status option id
  columnId: z.string().uuid().optional(), // status option id (FE sometimes reads columnId)
  position: z.number().int().nullable().optional(),
  assigneeIds: z.array(z.string().uuid()).optional(),
});

export const taskboardSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  bindings: taskboardBindingsSchema.nullable().optional(),
  columns: z.array(taskboardColumnSchema).optional(),
  cards: z.array(taskboardCardSchema).optional(),
});

export const updateTaskboardDto = z.object({
  name: z.string().trim().min(1).max(120),
});
