export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";
import { projectDashboardService } from "@/modules/projects/service/project-dashboard.service";

type Ctx = { params: { projectId: string } };

export async function POST(req: Request, { params }: Ctx) {
  const sid = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sid)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const me = await AuthService.getMeFromSessionId(sid);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { title } = (await req.json().catch(() => ({}))) as { title?: string };
  const doc = await projectDashboardService.createDocument(
    params.projectId,
    me.id,
    title
  );
  if (!doc) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json(doc, { status: 201 });
}
