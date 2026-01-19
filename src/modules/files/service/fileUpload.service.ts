import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { FileRepo } from "../repo/file.repo";

export class ForbiddenError extends Error {
  override name = "ForbiddenError";
}
export class BadRequestError extends Error {
  override name = "BadRequestError";
}

const UPLOADS_BUCKET = process.env.S3_UPLOADS_BUCKET;
const UPLOADS_REGION = process.env.S3_UPLOADS_REGION ?? process.env.S3_REGION;

const s3 =
  UPLOADS_BUCKET && UPLOADS_REGION
    ? new S3Client({
        region: UPLOADS_REGION,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
        },
      })
    : null;

function sanitizeFilename(name: string) {
  // prevent path traversal / weird keys
  const base = name.split("/").pop()?.split("\\").pop() ?? "file";
  return base.replace(/[^\w.\-() ]+/g, "_").slice(0, 160);
}

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB v1 (change anytime)
const MAX_FILES_PER_MESSAGE = 10;

export type PresignInput = {
  filename: string;
  mimeType: string;
  size: number;
};

export class FileUploadService {
  private repo = new FileRepo();

  async presignUploads(args: {
    projectId: string;
    userId: string;
    files: PresignInput[];
  }) {
    if (!UPLOADS_BUCKET || !UPLOADS_REGION || !s3) {
      throw new Error("S3 uploads not configured (S3_UPLOADS_BUCKET/REGION)");
    }

    const { projectId, userId, files } = args;

    if (!files?.length) throw new BadRequestError("No files provided");
    if (files.length > MAX_FILES_PER_MESSAGE) {
      throw new BadRequestError(
        `Max ${MAX_FILES_PER_MESSAGE} files per message`,
      );
    }

    const isMember = await this.repo.isProjectMember(projectId, userId);
    if (!isMember) throw new ForbiddenError("Not a member of this project");

    // validate + precompute ids/keys
    const prepared = files.map((f) => {
      const size = Number(f.size || 0);
      if (!Number.isFinite(size) || size <= 0) {
        throw new BadRequestError("Invalid file size");
      }
      if (size > MAX_FILE_BYTES) {
        throw new BadRequestError(
          `File too large (max ${MAX_FILE_BYTES} bytes)`,
        );
      }

      const id = crypto.randomUUID();
      const safeName = sanitizeFilename(f.filename || "file");
      const mime = f.mimeType || "application/octet-stream";

      const storageKey = `uploads/projects/${projectId}/files/${id}/${safeName}`;

      return { id, filename: safeName, mime, size, storageKey };
    });

    // create DB rows first (so downloads are always controlled by DB + membership)
    await this.repo.createManyFiles(
      prepared.map((p) => ({
        id: p.id,
        projectId,
        uploaderId: userId,
        filename: p.filename,
        mime: p.mime,
        size: p.size,
        storageKey: p.storageKey,
      })),
    );

    const signed = await Promise.all(
      prepared.map(async (p) => {
        const cmd = new PutObjectCommand({
          Bucket: UPLOADS_BUCKET,
          Key: p.storageKey,
          ContentType: p.mime,
        });

        const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 });
        return { fileId: p.id, filename: p.filename, uploadUrl };
      }),
    );

    return { files: signed };
  }
}
