// src/modules/documents/dto/doc.dto.ts
import { z } from "zod";
import { PROPERTY_TYPES } from "../domain/types";

export const PropertyOptionDto = z.object({
  id: z.string(),
  value: z.string(),
  color: z.string().nullable().optional(),
  position: z.number().nullable().optional(),
});

export const PropertyDefinitionDto = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(PROPERTY_TYPES), // ✅ don’t use nativeEnum, use the tuple
  options: z.array(PropertyOptionDto).default([]),
});
export type PropertyDefinitionDto = z.infer<typeof PropertyDefinitionDto>;

export const PropertyValueDto = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), value: z.string().nullable() }),
  z.object({ type: z.literal("number"), value: z.number().nullable() }),
  z.object({ type: z.literal("email"), value: z.string().nullable() }),
  z.object({ type: z.literal("checkbox"), value: z.boolean() }),
  z.object({ type: z.literal("date_time"), value: z.string().nullable() }), // ISO
  z.object({ type: z.literal("select"), value: z.string().nullable() }), // optionId
  z.object({ type: z.literal("status"), value: z.string().nullable() }), // optionId
  z.object({ type: z.literal("multi_select"), value: z.array(z.string()) }),
  z.object({ type: z.literal("person"), value: z.array(z.string()) }),
  z.object({ type: z.literal("file"), value: z.array(z.string()) }),
]);
export type PropertyValueDto = z.infer<typeof PropertyValueDto>;
