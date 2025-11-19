import { z } from "zod";

/**
 * Metadata we store in prisma.embed.meta for a Google Drive file.
 * This should stay small + serializable.
 */
export const googleDriveEmbedMetaSchema = z.object({
  title: z.string().min(1),
  mimeType: z.string().min(1),
  iconUrl: z.string().url().optional().nullable(),
});

export type GoogleDriveEmbedMeta = z.infer<typeof googleDriveEmbedMetaSchema>;

export const createDriveEmbedBodySchema = z.object({
  url: z.string().url(),
  name: z.string().min(1).optional(),
});

export type CreateDriveEmbedBody = z.infer<typeof createDriveEmbedBodySchema>;
