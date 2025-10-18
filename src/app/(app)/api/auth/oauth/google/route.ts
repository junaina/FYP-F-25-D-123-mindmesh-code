//src/app/(app)/api/auth/oauth/google/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createOauthState } from "@/lib/auth/oauth";
import { googleAuthUrl } from "@/modules/auth/service/auth.service";

export async function GET(req: NextRequest) {
  const rawNext = req.nextUrl.searchParams.get("next") || "/home";
  const next = rawNext.startsWith("/")
    ? rawNext.replace(/\s+/g, "").replace(/\.+$/, "")
    : "/home";

  const state = await createOauthState(next);
  const url = googleAuthUrl(state);

  return NextResponse.redirect(url);
}
