import { z } from "zod";
import {
  PropertyTypeDto,
  PropertyValueDto,
} from "@/modules/documents/dto/doc.dto";

export const ProjectParamsDto = z.object({ projectId: z.string().uuid() });
export const CollectionParamsDto = ProjectParamsDto.extend({
  collectionId: z.string().uuid(),
});
export const DocInCollectionParamsDto = CollectionParamsDto.extend({
  docId: z.string().uuid(),
});
export const PropInCollectionParamsDto = CollectionParamsDto.extend({
  propertyId: z.string().uuid(),
});
export const OptionInCollectionParamsDto = PropInCollectionParamsDto.extend({
  optionId: z.string().uuid(),
});

export const CreateTableBodyDto = z.object({
  name: z.string().trim().min(1).max(128),
  documentId: z.string().uuid(), 
});
export const RenameTableBodyDto = z.object({
  name: z.string().trim().min(1).max(128),
});

export const AddColumnBodyDto = z.object({
  name: z.string().trim().min(1).max(128),
  type: PropertyTypeDto,
  options: z
    .array(
      z.object({
        value: z.string().min(1),
        color: z.string().optional().nullable(),
        position: z.number().int().nonnegative().optional().nullable(),
      })
    )
    .optional(),
});

export const UpdateColumnBodyDto = z
  .object({
    name: z.string().trim().min(1).max(128).optional(),
    type: PropertyTypeDto.optional(),
  })
  .refine((b) => b.name !== undefined || b.type !== undefined, {
    message: "Provide at least one of name or type",
  });

export const CreateRowBodyDto = z.object({
  title: z.string().trim().min(1).max(256).default("Untitled"),
  description: z.string().nullable().optional(),
  initialProperties: z.record(z.string(), PropertyValueDto).optional(),
});

export const RenameRowBodyDto = z.object({
  title: z.string().trim().min(1).max(256),
  description: z.string().nullable().optional(),
});

export const PatchCellBodyDto = PropertyValueDto;

export const SaveOptionsBodyDto = z.object({
  options: z.array(
    z.object({
      id: z.string().uuid().optional(),
      value: z.string().min(1).max(200),
      color: z.string().nullable().optional(),
      position: z.number().int().nullable().optional(),
    })
  ),
});

export const PatchOptionBodyDto = z
  .object({
    value: z.string().min(1).max(200).optional(),
    color: z.string().nullable().optional(),
    position: z.number().int().nullable().optional(),
  })
  .refine(
    (b) =>
      b.value !== undefined ||
      b.color !== undefined ||
      b.position !== undefined,
    { message: "Provide at least one of value, color, or position" }
  );
