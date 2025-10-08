import { z } from "zod";

export const ProjectCollectionParamsDto = z.object({
  projectId: z.string().uuid(),
  collectionId: z.string().uuid(),
});
export type ProjectCollectionParamsDto = z.infer<typeof ProjectCollectionParamsDto>;

export const PatchCollectionBodyDto = z.object({
  name: z.string().min(1).optional(),
});
export type PatchCollectionBodyDto = z.infer<typeof PatchCollectionBodyDto>;

export const parseProjectCollectionParams = (p: unknown) =>
  ProjectCollectionParamsDto.parse(p);
export const parsePatchCollectionBody = (b: unknown) =>
  PatchCollectionBodyDto.parse(b);
