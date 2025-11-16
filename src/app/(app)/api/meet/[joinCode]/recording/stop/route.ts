// src/app/(app)/api/meet/[joinCode]/recording/stop/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";
import { MeetingService } from "@/modules/meetings/services/meeting.service";

type RouteContext = {
  params: { joinCode: string };
};

export async function POST(_req: Request, context: Promise<RouteContext>) {
  const { params } = await context;
  const joinCode = params.joinCode;

  if (!joinCode) {
    return NextResponse.json({ error: "Missing join code" }, { status: 400 });
  }

  const sid = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await AuthService.getMeFromSessionId(sid);
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await MeetingService.stopRecordingForJoinCode({
      joinCode,
      userId: me.id,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    const msg = err?.message ?? "Failed to stop recording";

    const status = msg.includes("Meeting not found")
      ? 404
      : msg.includes("No recording found")
      ? 409 // conflict – nothing to stop
      : msg.includes("not allowed")
      ? 403
      : 500;

    console.error("stop-recording error", err);
    return NextResponse.json({ error: msg }, { status });
  }
}
