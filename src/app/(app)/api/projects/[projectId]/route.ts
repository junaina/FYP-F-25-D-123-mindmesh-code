import { NextRequest, NextResponse } from "next/server";
import { projectService } from "@/modules/projects/service/project.service";
import { RenameProjectInputSchema } from "@/modules/projects/dto/project.dto";
import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";
import { ok, badRequest } from "@/lib/auth/responses";
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await ctx.params;
    //reading sesh cookie and resolving user
    const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionId) return new NextResponse("Unauthorized", { status: 401 });

    const me = await AuthService.getMeFromSessionId(sessionId);
    if (!me) return new NextResponse("Unauthorized", { status: 401 });

    //validating req body
    const json = await req.json();
    const input = RenameProjectInputSchema.parse(json);

    //rbac adn rename
    const project = await projectService.renameForUser(me.id, projectId, input);
    return NextResponse.json(project, { status: 200 });
  } catch (err: any) {
    const status = typeof err?.status === "number" ? err.status : 400;
    const message = err?.message ?? "bad_request";
    return new NextResponse(message, { status });
  }
}
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await ctx.params;

    const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionId) return new NextResponse("unauthorized", { status: 401 });

    const me = await AuthService.getMeFromSessionId(sessionId);
    if (!me) return new NextResponse("unauthorized", { status: 401 });

    const deleted = await projectService.deleteForUser(me.id, projectId);
    return ok(deleted); // -> { id }
  } catch (err: any) {
    const status = typeof err?.status === "number" ? err.status : 400;
    const message = err?.message ?? "bad_request";
    return badRequest(message);
  }
}
