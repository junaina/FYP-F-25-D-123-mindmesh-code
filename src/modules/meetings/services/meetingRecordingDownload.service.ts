import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { MeetingRecordingRepo } from "@/modules/meetings/repo/meetingRecording.repo";
import { MeetingRepo } from "@/modules/meetings/repo/meeting.repo";

export type MeetingRecordingStatus = "IN_PROGRESS" | "COMPLETED" | "FAILED";

export class NotFoundError extends Error {
  override name = "NotFoundError";
}

export class ForbiddenError extends Error {
  override name = "ForbiddenError";
}

const S3_BUCKET = process.env.S3_BUCKET;
const S3_REGION = process.env.S3_REGION;

if (!S3_BUCKET || !S3_REGION) {
  // Better to know loudly if we misconfigured S3
  // eslint-disable-next-line no-console
  console.warn(
    "[MeetingRecordingDownloadService] Missing S3_BUCKET or S3_REGION env vars"
  );
}

const s3Client =
  S3_BUCKET && S3_REGION
    ? new S3Client({
        region: S3_REGION,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
        },
      })
    : null;

type CreateSignedUrlArgs = {
  recordingKey: string;
  userId: string;
};

export const MeetingRecordingDownloadService = {
  /**
   * Returns a short-lived signed URL for downloading a recording.
   * Validates that the user is a member of the recording's project.
   */
  async createSignedUrlForRecording(
    args: CreateSignedUrlArgs
  ): Promise<string> {
    const { recordingKey, userId } = args;

    if (!S3_BUCKET || !S3_REGION || !s3Client) {
      throw new Error(
        "S3 is not configured (missing S3_BUCKET/S3_REGION or S3 client)"
      );
    }

    // Normalize what we get from the URL into the full s3Key stored in DB.
    // Your DB s3Key looks like: "recordings/<meetingId>-<timestamp>.mp4"
    let s3Key = recordingKey;

    // If there's no "recordings/" prefix, add it.
    if (!s3Key.startsWith("recordings/")) {
      s3Key = `recordings/${s3Key}`;
    }

    // If there's no file extension, assume ".mp4".
    if (!s3Key.endsWith(".mp4")) {
      s3Key = `${s3Key}.mp4`;
    }

    const rec = await MeetingRecordingRepo.findByS3KeyWithMeeting(s3Key);

    if (!rec || !rec.meeting) {
      throw new NotFoundError("Recording not found");
    }

    // Check project membership
    const isMember = await MeetingRepo.isProjectMember(
      rec.meeting.projectId,
      userId
    );
    if (!isMember) {
      throw new ForbiddenError("You are not a member of this project");
    }

    if (!rec.s3Key) {
      throw new NotFoundError("Recording does not have an S3 key yet");
    }

    if (rec.status !== "COMPLETED") {
      throw new ForbiddenError("Recording is not yet completed");
    }

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: rec.s3Key,
    });

    // URL valid for 5 minutes
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 60 * 5,
    });

    return signedUrl;
  },
};
