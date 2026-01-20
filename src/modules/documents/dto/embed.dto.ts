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
export const createGithubEmbedBodySchema = z.object({
  url: z.string().url(),
});
export type CreateGithubEmbedBody = z.infer<typeof createGithubEmbedBodySchema>;

// Meta (stored in prisma.embed.meta)
export const githubIssueMetaSchema = z.object({
  type: z.literal("issue"),
  owner: z.string().min(1),
  repo: z.string().min(1),
  number: z.number().int().positive(),
  title: z.string().min(1),
  author: z.string().min(1),
  state: z.enum(["OPEN", "CLOSED"]),
  updatedAt: z.string().min(1),
  htmlUrl: z.string().url(),
});

export const githubPrMetaSchema = z.object({
  type: z.literal("pr"),
  owner: z.string().min(1),
  repo: z.string().min(1),
  number: z.number().int().positive(),
  title: z.string().min(1),
  author: z.string().min(1),
  state: z.enum(["OPEN", "CLOSED", "MERGED"]),
  merged: z.boolean(),
  updatedAt: z.string().min(1),
  htmlUrl: z.string().url(),
});
