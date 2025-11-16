// src/app/(app)/api/recordings/[recordingId]/download/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { getMeFromSessionId } from "@/modules/auth/service/auth.service";
import {
  MeetingRecordingDownloadService,
  NotFoundError,
  ForbiddenError,
} from "@/modules/meetings/services/meetingRecordingDownload.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: Promise<{ params: { recordingId: string } }>
) {
  const { params } = await context;
  const recordingKey = params.recordingId; // this is *not* a DB id, it's part of the S3 key

  if (!recordingKey) {
    return NextResponse.json(
      { error: "Missing recording identifier" },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await getMeFromSessionId(sessionId);
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const signedUrl =
      await MeetingRecordingDownloadService.createSignedUrlForRecording({
        recordingKey,
        userId: me.id,
      });

    return NextResponse.redirect(signedUrl, { status: 307 });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }

    console.error("Recording download error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
