export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";
import { taskboardService } from "@/modules/taskboard/service/taskboard.service";

type Params = { projectId: string; propertyId: string; optionId: string };

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
    const { projectId, propertyId, optionId } = await ctx.params;

    const cookieStore = await cookies();
    const sid = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sid)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const me = await AuthService.getMeFromSessionId(sid);
    if (!me)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = (await req.json()) as { label?: unknown; title?: unknown };
    const label =
      typeof body.label === "string"
        ? body.label
        : typeof body.title === "string"
          ? body.title
          : "";

    await taskboardService.renameColumnForProject(
      projectId,
      me.id,
      propertyId,
      optionId,
      label,
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: unknown) {
    console.error("[taskboard column PATCH]", err);
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
    const { projectId, propertyId, optionId } = await ctx.params;

    const cookieStore = await cookies();
    const sid = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sid)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const me = await AuthService.getMeFromSessionId(sid);
    if (!me)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    await taskboardService.deleteColumnForProject(
      projectId,
      me.id,
      propertyId,
      optionId,
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: unknown) {
    console.error("[taskboard column DELETE]", err);
    return NextResponse.json(
      { error: getMessage(err) },
      { status: getStatus(err) },
    );
  }
}
