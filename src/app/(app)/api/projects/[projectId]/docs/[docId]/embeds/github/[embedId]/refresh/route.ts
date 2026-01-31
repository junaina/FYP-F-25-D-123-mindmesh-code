// src/app/(app)/api/projects/[projectId]/docs/[docId]/embeds/github/[embedId]/refresh/route.ts
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";
import { EmbedService } from "@/modules/documents/services/embed.service";

export async function POST(
  req: NextRequest,
  ctx: {
    params: Promise<{ projectId: string; docId: string; embedId: string }>;
  },
) {
  try {
    const { projectId, docId, embedId } = await ctx.params;

    const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionId) return new NextResponse("unauthorized", { status: 401 });

    const me = await AuthService.getMeFromSessionId(sessionId);
    if (!me) return new NextResponse("unauthorized", { status: 401 });

    const meta = await EmbedService.refreshGitHubEmbed({
      projectId,
      docId,
      userId: me.id,
      embedId,
    });

    return NextResponse.json(meta, { status: 200 });
  } catch (err: any) {
    const status = typeof err?.status === "number" ? err.status : 400;
    const message = err?.message ?? "bad_request";
    if (message === "GITHUB_NOT_CONNECTED") {
      return NextResponse.json(
        { code: "GITHUB_NOT_CONNECTED" },
        { status: 409 },
      );
    }
    return new NextResponse(message, { status });
  }
}
