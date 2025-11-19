import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";
import { projectService } from "@/modules/projects/service/project.service";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await ctx.params;

    const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionId) {
      return new NextResponse("unauthorized", { status: 401 });
    }

    const me = await AuthService.getMeFromSessionId(sessionId);
    if (!me) {
      return new NextResponse("unauthorized", { status: 401 });
    }

    const result = await projectService.acceptInviteForUser(
      me.id,
      me.email,
      token
    );

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    const status = typeof err?.status === "number" ? err.status : 400;
    const message = err?.message ?? "bad_request";
    return new NextResponse(message, { status });
  }
}
