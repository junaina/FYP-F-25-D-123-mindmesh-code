import { z } from "zod";
import { PROPERTY_TYPES } from "@/modules/documents/domain/types";

type PT = (typeof PROPERTY_TYPES)[number];
const PROPERTY_TYPES_TUPLE = [...PROPERTY_TYPES] as [PT, ...PT[]];
export const PropertyTypeDto = z.enum(PROPERTY_TYPES_TUPLE);
export const ProjectDocParamsDto = z.object({
  projectId: z.string().uuid(),
  docId: z.string().uuid(),
});
export type ProjectDocParamsDto = z.infer<typeof ProjectDocParamsDto>;

export const ProjectDocPropParamsDto = ProjectDocParamsDto.extend({
  propertyId: z.string().uuid(),
});
export type ProjectDocPropParamsDto = z.infer<typeof ProjectDocPropParamsDto>;
export type PropertyTypeDto = z.infer<typeof PropertyTypeDto>;
export const PropertyOptionDto = z.object({
  id: z.string().uuid(), // PropertyOption.id (UUID in DB)
  value: z.string().min(0).max(200),
  color: z.string().nullable().optional(),
  position: z.number().int().nullable().optional(), // optional; UI ordering
});
export type PropertyOptionDto = z.infer<typeof PropertyOptionDto>;

export const PropertyDefinitionDto = z.object({
  id: z.string().uuid(), // PropertyDefinition.id
  name: z.string().min(1),
  type: PropertyTypeDto,
  options: z.array(PropertyOptionDto).default([]),
});
export type PropertyDefinitionDto = z.infer<typeof PropertyDefinitionDto>;
/* ---------------------------------
   Property values (kept name)
   NOTE:
   - select/status carry optionId (UUID) or null
   - url is a free-text URL stored in valueString
---------------------------------- */
export const PropertyValueDto = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), value: z.string().nullable() }),
  z.object({ type: z.literal("number"), value: z.number().nullable() }),
  z.object({ type: z.literal("email"), value: z.string().nullable() }),
  z.object({ type: z.literal("checkbox"), value: z.boolean() }),
  z.object({ type: z.literal("date_time"), value: z.string().nullable() }), // ISO
  z.object({ type: z.literal("select"), value: z.string().uuid().nullable() }), // optionId
  z.object({ type: z.literal("status"), value: z.string().uuid().nullable() }), // optionId
  z.object({ type: z.literal("multi_select"), value: z.array(z.string()) }),
  z.object({ type: z.literal("person"), value: z.array(z.string()) }),
  z.object({ type: z.literal("file"), value: z.array(z.string()) }),
  z.object({
    type: z.literal("url"),
    value: z.string().url().nullable().or(z.literal("")),
  }), // free-text URL
]);
export type PropertyValueDto = z.infer<typeof PropertyValueDto>;
/* ---------------------------------
   GET /api/docs/:id response
---------------------------------- */
export const DocHeaderDto = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(), // include this to match your service response
  title: z.string(),
  description: z.string().nullable(),
  createdAt: z.string(), // ISO
  updatedAt: z.string(), // ISO
  properties: z.array(PropertyDefinitionDto), // doc-scoped definitions
});
export type DocHeaderDto = z.infer<typeof DocHeaderDto>;
/* ---------------------------------
   PATCH /api/docs/:id body (values only)
   { title?, description?, properties?: { [propName]: PropertyValueDto } }
---------------------------------- */
export const PatchDocHeaderDto = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  properties: z.record(z.string(), PropertyValueDto).optional(),
});
export type PatchDocHeaderDto = z.infer<typeof PatchDocHeaderDto>;
/* ---------------------------------
   Params for /api/docs/:id
---------------------------------- */
export const DocIdParamDto = z.object({ id: z.string().uuid() });
export type DocIdParamDto = z.infer<typeof DocIdParamDto>;
/* ---------------------------------
   PUT /api/docs/:docId/properties/:propertyId/options
---------------------------------- */
export const DocPropOptionsParamsDto = z.object({
  docId: z.string().uuid(),
  propertyId: z.string().uuid(),
});
export type DocPropOptionsParamsDto = z.infer<typeof DocPropOptionsParamsDto>;

export const SavePropertyOptionsDto = z.object({
  options: z.array(
    z.object({
      id: z.string().uuid().optional(), // upsert semantics
      value: z.string().min(1).max(200),
      color: z.string().nullable().optional(),
      position: z.number().int().nullable().optional(),
    })
  ),
});
export type SavePropertyOptionsDto = z.infer<typeof SavePropertyOptionsDto>;
/* ---------------------------------
   Tiny helpers so routes stay tidy
---------------------------------- */
export function parseDocId(params: unknown) {
  return DocIdParamDto.parse(params);
}
export function parsePatchDocHeader(json: unknown) {
  return PatchDocHeaderDto.parse(json);
}
export function parseDocPropOptionsParams(params: unknown) {
  return DocPropOptionsParamsDto.parse(params);
}
export async function parseSavePropertyOptions(json: unknown) {
  return SavePropertyOptionsDto.parse(json);
}
export const parseProjectDocParams = (p: unknown) =>
  ProjectDocParamsDto.parse(p);
export const parseProjectDocPropParams = (p: unknown) =>
  ProjectDocPropParamsDto.parse(p);
