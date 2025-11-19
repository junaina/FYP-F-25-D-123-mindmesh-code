// src/app/api/projects/[projectId]/meetings/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";
import { MeetingService } from "@/modules/meetings/services/meeting.service";

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // 1) auth (same pattern as /api/me)
    const cookieStore = await cookies();
    const sid = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sid) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const me = await AuthService.getMeFromSessionId(sid);
    if (!me) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const projectId = params.projectId;

    // 2) read & sanitize body
    const body = await req.json().catch(() => ({}));
    const title =
      typeof body.title === "string" && body.title.trim().length > 0
        ? body.title
        : "Untitled meeting";

    // 3) call service
    const meeting = await MeetingService.createProjectMeeting({
      projectId,
      userId: me.id,
      title,
    });

    // 4) build join URL
    const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000"; // set in prod
    const joinUrl = `${baseUrl}/mesh-meet/${meeting.joinCode}`;

    // 5) respond for frontend
    return NextResponse.json(
      {
        meeting: {
          id: meeting.id,
          title: meeting.title,
          joinCode: meeting.joinCode,
          joinUrl,
          status: meeting.status,
          createdAt: meeting.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Error creating meeting:", err);

    if (err instanceof Error && err.message === "Forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
