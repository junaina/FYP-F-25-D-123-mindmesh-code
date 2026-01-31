// src/app/(app)/api/integrations/github/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, isSecureRequest } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";
import { GitHubAuthService } from "@/modules/integrations/github/services/githubAuth.service";

const OAUTH_STATE_COOKIE = "mm_github_oauth_state";
const OAUTH_RETURN_TO_COOKIE = "mm_github_oauth_return_to";
const OAUTH_COOKIE_MAX_AGE_SECONDS = 10 * 60; // 10 minutes

function safeReturnTo(input: string | null | undefined) {
  if (!input) return "/settings/integrations?github=connected";
  // only allow same-origin relative paths
  if (!input.startsWith("/")) return "/settings/integrations?github=connected";
  if (input.startsWith("//")) return "/settings/integrations?github=connected";
  return input;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const returnTo = safeReturnTo(url.searchParams.get("returnTo"));

    const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionId) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const me = await AuthService.getMeFromSessionId(sessionId);
    if (!me) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const state = crypto.randomUUID();
    const authUrl = GitHubAuthService.buildAuthorizeUrl({ state });

    const secure = isSecureRequest(req);
    const res = NextResponse.redirect(authUrl);

    res.cookies.set(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: OAUTH_COOKIE_MAX_AGE_SECONDS,
    });

    res.cookies.set(OAUTH_RETURN_TO_COOKIE, returnTo, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: OAUTH_COOKIE_MAX_AGE_SECONDS,
    });

    return res;
  } catch (err) {
    console.error("GitHub start error", err);
    return NextResponse.redirect(
      new URL("/settings/integrations?github=error", req.url),
    );
  }
}
