// src/app/(app)/api/integrations/github/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, isSecureRequest } from "@/lib/auth/session";
import { getMeFromSessionId } from "@/modules/auth/service/auth.service";
import { GitHubAuthService } from "@/modules/integrations/github/services/githubAuth.service";

const OAUTH_STATE_COOKIE = "mm_github_oauth_state";
const OAUTH_RETURN_TO_COOKIE = "mm_github_oauth_return_to";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code) {
      return NextResponse.redirect(
        new URL("/settings/integrations?github=error", req.url),
      );
    }

    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sessionId) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const user = await getMeFromSessionId(sessionId);
    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
    if (!state || !expectedState || state !== expectedState) {
      return NextResponse.redirect(
        new URL("/settings/integrations?github=state_mismatch", req.url),
      );
    }

    const returnTo =
      cookieStore.get(OAUTH_RETURN_TO_COOKIE)?.value ??
      "/settings/integrations?github=connected";

    await GitHubAuthService.handleCallback({
      userId: user.id,
      code,
    });

    const secure = isSecureRequest(req);
    const res = NextResponse.redirect(new URL(returnTo, req.url));

    // clear ephemeral cookies
    res.cookies.set(OAUTH_STATE_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 0,
    });
    res.cookies.set(OAUTH_RETURN_TO_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 0,
    });

    return res;
  } catch (err) {
    console.error("GitHub callback error", err);
    return NextResponse.redirect(
      new URL("/settings/integrations?github=error", req.url),
    );
  }
}
