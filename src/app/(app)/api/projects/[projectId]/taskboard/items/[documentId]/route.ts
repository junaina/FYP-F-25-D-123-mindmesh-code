export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";
import { taskboardService } from "@/modules/taskboard/service/taskboard.service";

type Params = { projectId: string; documentId: string };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function getStatus(err: unknown): number {
  if (isRecord(err) && typeof err.status === "number") return err.status;
  return 500;
}
function getMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return "Internal Server Error";
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<Params> },
) {
  try {
    const { projectId, documentId } = await ctx.params;

    const cookieStore = await cookies();
    const sid = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sid)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const me = await AuthService.getMeFromSessionId(sid);
    if (!me)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const patch = (await req.json()) as {
      title?: string;
      description?: string;
      optionId?: string;
      position?: number | null;
      assigneeIds?: string[];
    };

    const card = await taskboardService.updateItemForProject(
      projectId,
      me.id,
      documentId,
      patch,
    );
    return NextResponse.json(card, { status: 200 });
  } catch (err: unknown) {
    console.error("[taskboard item PATCH]", err);
    return NextResponse.json(
      { error: getMessage(err) },
      { status: getStatus(err) },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<Params> },
) {
  try {
    const { projectId, documentId } = await ctx.params;

    const cookieStore = await cookies();
    const sid = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sid)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const me = await AuthService.getMeFromSessionId(sid);
    if (!me)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    await taskboardService.deleteItemForProject(projectId, me.id, documentId);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: unknown) {
    console.error("[taskboard item DELETE]", err);
    return NextResponse.json(
      { error: getMessage(err) },
      { status: getStatus(err) },
    );
  }
}
