// src/app/(app)/api/auth/logout-all/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";

export async function POST() {
  const jar = await cookies();
  const sid = jar.get(SESSION_COOKIE)?.value;
  if (!sid) {
    // no session; nothing to do
    return new NextResponse(null, { status: 204 });
  }

  // Who is this?
  const me = await AuthService.getMeFromSessionId(sid);
  if (me) {
    await AuthService.logoutAll(me.id);
  } else {
    // If session isn’t valid, still try to revoke just in case
    await AuthService.logout(sid);
  }

  // Clear cookie locally
  const res = new NextResponse(null, { status: 204 });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
