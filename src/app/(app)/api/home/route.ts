export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";
import { homeService } from "@/modules/home/service/home.service";

export async function GET() {
  // same pattern as /api/auth/me
  const sid = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sid)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const me = await AuthService.getMeFromSessionId(sid);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const data = await homeService.getHome(me.id);
  return NextResponse.json(data, { status: 200 });
}
