//python fast api 
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";

import {
  summarizeMeetingForJoinCode,
  NotFoundError,
  ForbiddenError,
  TranscriptMissingError,
} from "@/modules/meetings/services/meetingSummarization.service";

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

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // empty body ok
    }

    const result = await summarizeMeetingForJoinCode({
      joinCode,
      userId: user.id,
      options: {
        format: body?.format,
        maxTokens: body?.maxTokens,
      },
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("Summarization error", err);

    if (err instanceof ForbiddenError) return new NextResponse(err.message, { status: 403 });
    if (err instanceof NotFoundError) return new NextResponse(err.message, { status: 404 });
    if (err instanceof TranscriptMissingError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }

    return new NextResponse("Failed to summarize meeting", { status: 500 });
  }
}
