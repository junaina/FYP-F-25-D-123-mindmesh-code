import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";
import { requireUserToken } from "@/modules/integrations/slack/services/slackAuth.service";
import {
  postMessage,
  getPermalink,
} from "@/modules/integrations/slack/services/slackApi.service";

const PostSchema = z.object({
  channelId: z.string().min(1),
  text: z.string().min(1).max(40_000),
});

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionId) return new NextResponse("unauthorized", { status: 401 });

    const me = await AuthService.getMeFromSessionId(sessionId);
    if (!me) return new NextResponse("unauthorized", { status: 401 });

    const body = PostSchema.parse(await req.json());
    const token = await requireUserToken(me.id);

    const posted = await postMessage(token, body.channelId, body.text);
    if (!posted.ok) {
      return NextResponse.json(
        { error: posted.error ?? "slack_post_failed" },
        { status: 400 },
      );
    }

    const pl = await getPermalink(token, posted.channel, posted.ts);
    return NextResponse.json({
      ok: true,
      channelId: posted.channel,
      ts: posted.ts,
      permalink: pl.ok ? pl.permalink : null,
    });
  } catch (err: any) {
    const status = typeof err?.status === "number" ? err.status : 400;
    return new NextResponse(err?.message ?? "bad_request", { status });
  }
}
