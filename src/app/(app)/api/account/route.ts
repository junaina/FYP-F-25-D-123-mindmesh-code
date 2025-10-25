export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";
import * as userService from "@/modules/user/service/user.service";
import { ok, badRequest } from "@/lib/auth/responses";
export async function DELETE() {
  try {
    const sid = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!sid) return badRequest("unauthorized");

    const me = await AuthService.getMeFromSessionId(sid);
    if (!me) return badRequest("unauthorized");

    await userService.deleteAccount(me.id);

    const res = NextResponse.json({ ok: true }, { status: 200 });
    res.cookies.set(SESSION_COOKIE, "", {
      ...sessionCookieOptions,
      maxAge: 0,
      expires: new Date(0),
    });
    return res;
  } catch (e: any) {
    const status = typeof e?.status === "number" ? e.status : 400;
    return NextResponse.json(
      { error: e?.message ?? "bad_request" },
      { status }
    );
  }
}
