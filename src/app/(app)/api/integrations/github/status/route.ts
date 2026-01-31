// src/app/(app)/api/integrations/github/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";
import { GitHubAuthService } from "@/modules/integrations/github/services/githubAuth.service";

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionId) return NextResponse.json({ connected: false });

    const me = await AuthService.getMeFromSessionId(sessionId);
    if (!me) return NextResponse.json({ connected: false });

    const status = await GitHubAuthService.getStatus({ userId: me.id });
    return NextResponse.json(status);
  } catch (err) {
    console.error("GitHub status error", err);
    return NextResponse.json({ connected: false });
  }
}
