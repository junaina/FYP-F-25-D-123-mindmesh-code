// src/app/(app)/api/meet/[joinCode]/token/route.ts
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

export async function GET(_req: Request, context: Promise<RouteContext>) {
  const { params } = await context;
  const joinCode = params.joinCode;

  if (!joinCode) {
    return NextResponse.json({ error: "Missing join code" }, { status: 400 });
  }

  // 1) Require a logged-in user
  const sid = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await AuthService.getMeFromSessionId(sid);
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const displayName =
    `${me.firstName} ${me.lastName}`.trim() || me.email || "Mindmesh user";

  try {
    // 2) This will also check that the user is a member of the project
    const result = await MeetingService.createJoinTokenForJoinCode({
      joinCode,
      userId: me.id,
      displayName,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    const msg = err?.message ?? "Failed to create join token";

    if (msg.includes("Meeting not found")) {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    if (msg.includes("Forbidden")) {
      // from MeetingService when user is not a project member
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.error("join-token error", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
