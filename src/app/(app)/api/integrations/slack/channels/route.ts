import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";
import { requireUserToken } from "@/modules/integrations/slack/services/slackAuth.service";
import { listChannels } from "@/modules/integrations/slack/services/slackApi.service";

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionId) return new NextResponse("unauthorized", { status: 401 });

    const me = await AuthService.getMeFromSessionId(sessionId);
    if (!me) return new NextResponse("unauthorized", { status: 401 });

    const token = await requireUserToken(me.id);
    const resp = await listChannels(token);

    if (!resp.ok) {
      return NextResponse.json(
        { error: resp.error ?? "slack_list_channels_failed" },
        { status: 400 },
      );
    }

    const channels =
      resp.channels?.map((c) => ({
        id: c.id,
        name: c.name,
        isPrivate: c.is_private,
      })) ?? [];

    return NextResponse.json({ channels });
  } catch (err: any) {
    const status = typeof err?.status === "number" ? err.status : 400;
    return new NextResponse(err?.message ?? "bad_request", { status });
  }
}
