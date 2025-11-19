// src/app/(app)/api/meet/[joinCode]/recording/start/route.ts
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
    const result = await MeetingService.startRecordingForJoinCode({
      joinCode,
      userId: me.id,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    const msg = err?.message ?? "Failed to start recording";

    const status = msg.includes("Meeting not found")
      ? 404
      : msg.includes("not allowed")
      ? 403
      : 500;

    console.error("start-recording error", err);
    return NextResponse.json({ error: msg }, { status });
  }
}
