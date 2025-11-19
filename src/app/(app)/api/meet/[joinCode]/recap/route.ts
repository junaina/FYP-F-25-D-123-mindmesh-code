// src/app/(app)/api/meet/[joinCode]/recap/route.ts

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth/session";
import { getMeFromSessionId } from "@/modules/auth/service/auth.service";
import { MeetingRecapService } from "@/modules/meetings/services/meetingRecap.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  context: Promise<{ params: { joinCode: string } }>
) {
  const { params } = await context;
  const { joinCode } = params;

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
    const recap = await MeetingRecapService.getMeetingRecapForJoinCode({
      joinCode,
      userId: me.id,
    });

    return NextResponse.json(recap, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/meet/[joinCode]/recap error", err);
    const message = err?.message ?? "Unknown error";

    if (message === "Meeting not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (message.includes("not allowed") || message === "Unauthorized") {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
