// src/lib/validations/doc.ts
import { z } from "zod";

export const createDocSchema = z.object({
  projectId: z.string().uuid(),
  createdById: z.string().uuid(),
  title: z.string().min(1).max(200),
  content: z.any().optional(), // TipTap JSON
});

export const updateDocSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.any().optional(),
  isArchived: z.boolean().optional(),
});

export type CreateDocInput = z.infer<typeof createDocSchema>;
export type UpdateDocInput = z.infer<typeof updateDocSchema>;
