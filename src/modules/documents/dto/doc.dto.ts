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

export const paramIdsDto = z.object({
  projectId: z.string().min(1),
  docId: z.string().min(1),
});
export const propertyTypeDto = z.enum([
  "text",
  "number",
  "email",
  "url",
  "checkbox",
  "select",
  "multi_select",
  "status",
  "person",
  "file",
  "date_time",
]);
export type ProjectDocPropParamsDto = z.infer<typeof ProjectDocPropParamsDto>;
export type PropertyTypeDto = z.infer<typeof PropertyTypeDto>;

//when creating
export const propertyOptionInputDto = z.object({
  value: z.string().min(1),
  color: z.string().min(1).optional(),
  position: z.number().int().nonnegative().optional(),
});
export type PropertyOptionInputDto = z.infer<typeof propertyOptionInputDto>;

export const createPropertyBodyDto = z
  .object({
    name: z.string().min(1).max(128),
    type: propertyTypeDto,
    options: z.array(propertyOptionInputDto).optional(),
  })
  .refine(
    (b) => {
      const optTypes = new Set([
        "select",
        "multi_select",
        "status",
        "person",
        "file",
        "url",
        "email",
      ]);
      return !b.options || optTypes.has(b.type);
    },
    {
      message:
        "Options can only be set for select, multi_select, status, person, file, url, or email types",
    }
  );
export type CreatePropertyBodyDto = z.infer<typeof createPropertyBodyDto>;

//when updating
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

export const PropertyDefinitionWithValueDto = PropertyDefinitionDto.extend({
  value: PropertyValueDto.nullable().optional(),
});
export type PropertyDefinitionWithValueDto = z.infer<
  typeof PropertyDefinitionWithValueDto
>;
export const DocHeaderDto = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(), // include this to match your service response
  title: z.string(),
  description: z.string().nullable(),
  createdAt: z.string(), // ISO
  updatedAt: z.string(), // ISO
  properties: z.array(PropertyDefinitionWithValueDto), // doc-scoped definitions
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

export const PatchPropertyDefDto = z
  .object({
    name: z.string().trim().min(1).max(128).optional(),
    type: PropertyTypeDto.optional(),
    dropOptionsOnTypeChange: z.boolean().optional(),
  })
  .refine((b) => b.name !== undefined || b.type !== undefined, {
    message: "provide at least one of name or type",
  });
export type PatchPropertyDefDto = z.infer<typeof PatchPropertyDefDto>;
//body for editiing a single option's appearance
export const patchPropertyOptionDto = z
  .object({
    value: z.string().trim().min(1).max(200).optional(),
    color: z.string().nullable().optional(),
    position: z.number().int().nonnegative().nullable().optional(),
  })
  .refine(
    (d) =>
      d.value !== undefined ||
      d.color !== undefined ||
      d.position !== undefined,
    { message: "Provide at least one of value, color, or position" }
  );
export type PatchPropertyOptionDto = z.infer<typeof patchPropertyOptionDto>;
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
export const parsePatchPropertyDef = (b: unknown) =>
  PatchPropertyDefDto.parse(b);
export const parseParamIds = (p: unknown) => paramIdsDto.parse(p);
export const parsePatchPropertyOption = (b: unknown) =>
  patchPropertyOptionDto.parse(b);
