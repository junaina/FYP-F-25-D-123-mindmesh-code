// src/app/(app)/api/projects/[projectId]/docs/[docId]/embeds/github/route.ts
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";
import { createGithubEmbedBodySchema } from "@/modules/documents/dto/embed.dto";
import { EmbedService } from "@/modules/documents/services/embed.service";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ projectId: string; docId: string }> },
) {
  try {
    const { projectId, docId } = await ctx.params;

    const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionId) return new NextResponse("unauthorized", { status: 401 });

    const me = await AuthService.getMeFromSessionId(sessionId);
    if (!me) return new NextResponse("unauthorized", { status: 401 });

    const json = await req.json();
    const input = createGithubEmbedBodySchema.parse(json);

    const row = await EmbedService.addGitHubFromUrl({
      projectId,
      docId,
      userId: me.id,
      url: input.url,
    });

    return NextResponse.json(row, { status: 200 });
  } catch (err: any) {
    const status = typeof err?.status === "number" ? err.status : 400;
    const message = err?.message ?? "bad_request";
    // if you want your frontend to detect this cleanly:
    if (message === "GITHUB_NOT_CONNECTED") {
      return NextResponse.json(
        { code: "GITHUB_NOT_CONNECTED" },
        { status: 409 },
      );
    }
    return new NextResponse(message, { status });
  }
}
