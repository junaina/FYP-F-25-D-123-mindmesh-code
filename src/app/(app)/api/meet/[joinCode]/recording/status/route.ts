// src/app/(app)/api/meet/[joinCode]/recording/status/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { getMeFromSessionId } from "@/modules/auth/service/auth.service";
import {
  MeetingRecordingStatusService,
  NotFoundError,
  ForbiddenError,
} from "@/modules/meetings/services/meetingRecordingStatus.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: Promise<{ params: { joinCode: string } }>
) {
  const { params } = await context;
  const joinCode = params.joinCode;

  if (!joinCode) {
    return NextResponse.json({ error: "Missing joinCode" }, { status: 400 });
  }

  // Use your existing session cookie + auth service.
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
    const recording =
      await MeetingRecordingStatusService.getCurrentRecordingForJoinCode({
        joinCode,
        userId: me.id,
      });

    return NextResponse.json({ recording }, { status: 200 });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }

    console.error("Recording status error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
