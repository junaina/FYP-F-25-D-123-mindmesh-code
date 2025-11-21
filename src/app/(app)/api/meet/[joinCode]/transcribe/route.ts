// src/app/(app)/api/meet/[joinCode]/transcribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";
import {
  MeetingTranscriptionService,
  NotFoundError,
  ForbiddenError,
  RecordingFileMissingError,
} from "@/modules/meetings/services/meetingTranscription.service";

type RouteContext = {
  params: Promise<{ joinCode: string }>;
};

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { joinCode } = await params;

    const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionId) return new NextResponse("Unauthorized", { status: 401 });

    const user = await AuthService.getMeFromSessionId(sessionId);
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const result =
      await MeetingTranscriptionService.transcribeLatestRecordingForJoinCode({
        joinCode,
        userId: user.id,
      });

    return NextResponse.json(
      {
        transcript: result.transcript,
        segments: result.segments,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Transcription error", err);

    if (err instanceof ForbiddenError) {
      return new NextResponse(err.message, { status: 403 });
    }
    if (err instanceof NotFoundError) {
      return new NextResponse(err.message, { status: 404 });
    }
    if (err instanceof RecordingFileMissingError) {
      // Key difference: this tells you the recording file doesn't exist,
      // instead of a generic 500.
      return NextResponse.json({ error: err.message }, { status: 404 });
    }

    return new NextResponse("Failed to transcribe meeting", { status: 500 });
  }
}
