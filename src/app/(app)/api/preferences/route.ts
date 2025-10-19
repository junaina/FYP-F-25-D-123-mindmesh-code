export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";
import { ok, badRequest } from "@/lib/auth/responses";
import { prefsService } from "@/modules/prefs/service/preferences.service";
import { UpdatePrefsZ } from "@/modules/prefs/dto/preferences.dto";

export async function GET() {
  const sid = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sid) return badRequest("unauthorized");

  const me = await AuthService.getMeFromSessionId(sid);
  if (!me) return badRequest("unauthorized");

  const prefs = await prefsService.getForUser(me.id);
  return ok(prefs);
}

export async function PATCH(req: NextRequest) {
  try {
    const sid = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!sid) return badRequest("unauthorized");
    const me = await AuthService.getMeFromSessionId(sid);
    if (!me) return badRequest("unauthorized");

    const body = await req.json();
    const input = UpdatePrefsZ.parse(body);

    const updated = await prefsService.updateForUser(me.id, input);
    return ok(updated);
  } catch (e: any) {
    return badRequest(e?.message ?? "bad_request");
  }
}
