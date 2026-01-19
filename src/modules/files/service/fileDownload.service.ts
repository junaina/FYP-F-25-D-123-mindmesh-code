import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { FileRepo } from "../repo/file.repo";

export class NotFoundError extends Error {
  override name = "NotFoundError";
}
export class ForbiddenError extends Error {
  override name = "ForbiddenError";
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

export class FileDownloadService {
  private repo = new FileRepo();

  async createSignedUrlForFile(args: { fileId: string; userId: string }) {
    if (!UPLOADS_BUCKET || !UPLOADS_REGION || !s3) {
      throw new Error("S3 uploads not configured (S3_UPLOADS_BUCKET/REGION)");
    }

    const file = await this.repo.findById(args.fileId);
    if (!file) throw new NotFoundError("File not found");

    const isMember = await this.repo.isProjectMember(
      file.projectId,
      args.userId,
    );
    if (!isMember) throw new ForbiddenError("Not a member of this project");

    const cmd = new GetObjectCommand({
      Bucket: UPLOADS_BUCKET,
      Key: file.storageKey,
      // makes browser download use the original filename
      ResponseContentDisposition: `inline; filename="${file.filename}"`,
    });

    return getSignedUrl(s3, cmd, { expiresIn: 60 * 5 });
  }
}
