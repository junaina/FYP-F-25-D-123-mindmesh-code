import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";
import { projectService } from "@/modules/projects/service/project.service";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await ctx.params;

    const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionId) {
      return new NextResponse("unauthorized", { status: 401 });
    }

    const me = await AuthService.getMeFromSessionId(sessionId);
    if (!me) {
      return new NextResponse("unauthorized", { status: 401 });
    }

    const json = await req.json().catch(() => null);
    if (!json || typeof json.email !== "string") {
      return new NextResponse("email is required", { status: 400 });
    }

    const role = json.role as
      | "OWNER"
      | "ADMIN"
      | "MEMBER"
      | undefined;

    const invite = await projectService.createInviteForUser(
      me.id,
      projectId,
      json.email,
      role ?? "MEMBER"
    );

    return NextResponse.json({ id: invite.id }, { status: 201 });
  } catch (err: any) {
    const status = typeof err?.status === "number" ? err.status : 400;
    const message = err?.message ?? "bad_request";
    return new NextResponse(message, { status });
  }
}
