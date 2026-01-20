// src/lib/livekit.ts
//
// Helper functions for:
// - generating join tokens
// - starting/stopping recordings (egress) to S3
//
// SERVER-ONLY FILE – do not import in client components.

import {
  AccessToken,
  EgressClient,
  EncodedFileOutput,
  S3Upload,
} from "livekit-server-sdk";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_WS_URL = process.env.LIVEKIT_WS_URL;
const LIVEKIT_HTTP_URL =
  process.env.LIVEKIT_HTTP_URL ??
  (LIVEKIT_WS_URL ? LIVEKIT_WS_URL.replace("wss://", "https://") : undefined);

const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const S3_REGION = process.env.S3_REGION;
const S3_BUCKET = process.env.S3_BUCKET;

// Simple sanity check so errors are obvious in dev
if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  throw new Error(
    "Missing LIVEKIT_API_KEY or LIVEKIT_API_SECRET in environment"
  );
}

if (!LIVEKIT_HTTP_URL) {
  throw new Error(
    "Missing LIVEKIT_HTTP_URL or LIVEKIT_WS_URL in environment. " +
      "Set LIVEKIT_HTTP_URL=https://your-project.livekit.cloud"
  );
}

if (!S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY || !S3_REGION || !S3_BUCKET) {
  throw new Error(
    "Missing one of S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY / S3_REGION / S3_BUCKET in environment"
  );
}

// Reuse a single EgressClient instance
const egressClient = new EgressClient(
  LIVEKIT_HTTP_URL,
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET
);

/**
 * Create a LiveKit room name for a given meeting.
 * You’ll call this when creating the Meeting row and store it in meeting.livekitRoomName.
 * (If you already store a room name, you don’t need this.)
 */
export function buildLivekitRoomName(meetingId: string) {
  // naming convention for livekit is fine, just be consistent
  return `meeting-${meetingId}`;
}

/**
 * Generate a LiveKit join token for a user.
 * - roomName: must match meeting.livekitRoomName
 * - identity: usually your User.id (string UUID)
 * - name: what will show as participant name in LiveKit
 */
export async function createJoinToken(args: {
  roomName: string;
  identity: string; // user.id
  name: string; // "First Last"
  ttlSeconds?: number; // default: 2 hours
}) {
  const { roomName, identity, name, ttlSeconds = 2 * 60 * 60 } = args;

  const at = new AccessToken(LIVEKIT_API_KEY!, LIVEKIT_API_SECRET!, {
    identity, // stable identifier
    name, // display name
    ttl: ttlSeconds,
  });

  // Permissions for this participant
  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  const jwt = await at.toJwt();
  return jwt;
}

/**
 * Start a room composite recording to S3.
 * - roomName: LiveKit room name (meeting.livekitRoomName)
 * - meetingId: your Meeting.id (used to build S3 path)
 *
 * Returns:
 * - egressId: use this to stop recording later + store in MeetingRecording.egressId
 * - s3Key: the S3 object key (store in MeetingRecording.s3Key)
 */
export async function startRoomRecording(args: {
  roomName: string;
  meetingId: string;
}) {
  const { roomName, meetingId } = args;

  // Where in your bucket the recording will be stored
  const filepath = `recordings/${meetingId}-${Date.now()}.mp4`;

  // Configure output to S3 (matches the LiveKit doc example)
  const fileOutput = new EncodedFileOutput({
    filepath, // becomes the S3 object key
    output: {
      case: "s3",
      value: new S3Upload({
        accessKey: S3_ACCESS_KEY_ID!,
        secret: S3_SECRET_ACCESS_KEY!,
        region: S3_REGION!,
        bucket: S3_BUCKET!,
      }),
    },
  });

  // Start a RoomComposite egress – records the whole room into one file
  const info = await egressClient.startRoomCompositeEgress(
    roomName,
    { file: fileOutput },
    {
      layout: "speaker", // or "grid" etc; default layouts provided by LiveKit
    }
  );

  // LiveKit returns an EgressInfo object, including egressId
  const egressId = info.egressId;

  return {
    egressId,
    s3Key: filepath,
  };
}

/**
 * Stop an active egress (stop recording).
 * - egressId: the ID returned by startRoomRecording
 *
 * Returns the updated EgressInfo.
 */
export async function stopRoomRecording(egressId: string) {
  const info = await egressClient.stopEgress(egressId);
  return info;
}
