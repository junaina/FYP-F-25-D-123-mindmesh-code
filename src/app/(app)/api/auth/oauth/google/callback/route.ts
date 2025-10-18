// src/app/(app)/api/auth/oauth/google/callback/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyOauthState } from "@/lib/auth/oauth";
import {
  getClientInfoFromRequest,
  isSecureRequest,
  setSessionCookie,
} from "@/lib/auth/session";
import { googleCallback } from "@/modules/auth/service/auth.service";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state") || "";
  if (!code)
    return NextResponse.json({ error: "missing_code" }, { status: 400 });

  const v = await verifyOauthState(state);
  if (!v.ok)
    return NextResponse.redirect(new URL("/login?oauth=state_error", req.url));

  const { ip, ua } = getClientInfoFromRequest(req);

  try {
    const { sessionId } = await googleCallback({ code, state, ip, ua });
    setSessionCookie(sessionId, isSecureRequest(req));
    return NextResponse.redirect(new URL(v.next || "/home", req.url));
  } catch (e: any) {
    console.error("google_callback_error", {
      message: e?.message,
      name: e?.name,
      stack: e?.stack,
    });
    return NextResponse.redirect(new URL("/login?oauth=failed", req.url));
  }
}
