export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";
import { projectService } from "@/modules/projects/service/project.service";

// GET /api/projects  -> list projects for current user
export async function GET() {
  const sid = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sid)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const me = await AuthService.getMeFromSessionId(sid);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const projects = await projectService.listForSidebar(me.id);
    return NextResponse.json(projects, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "failed" }, { status: 500 });
  }
}

// POST /api/projects  -> create project (current user becomes OWNER)
export async function POST(req: Request) {
  const sid = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sid)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const me = await AuthService.getMeFromSessionId(sid);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  try {
    const project = await projectService.createForUser(me.id, {
      name: body.name,
      visibility: body.visibility,
    });
    return NextResponse.json(project, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "failed" }, { status: 400 });
  }
}
