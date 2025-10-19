export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { ok, badRequest } from "@/lib/auth/responses";
import * as AuthService from "@/modules/auth/service/auth.service";

export async function GET(_req: NextRequest) {
  try {
    const sid = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!sid) return badRequest("unauthorized");

    const me = await AuthService.getMeFromSessionId(sid);
    if (!me) return badRequest("unauthorized");

    const caps = await AuthService.getAuthCapabilities(me.id);
    return ok(caps); // { hasPassword: boolean, providers: string[] }
  } catch (e: any) {
    return badRequest(e?.message ?? "bad_request");
  }
}
