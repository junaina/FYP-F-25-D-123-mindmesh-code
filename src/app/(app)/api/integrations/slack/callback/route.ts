import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { getMeFromSessionId } from "@/modules/auth/service/auth.service";
import {
  SLACK_OAUTH_STATE_COOKIE,
  SLACK_OAUTH_RETURNTO_COOKIE,
  handleCallback,
} from "@/modules/integrations/slack/services/slackAuth.service";

const OAUTH_STATE_COOKIE = "mm_slack_oauth_state";
const OAUTH_RETURN_TO_COOKIE = "mm_slack_oauth_return_to";

function getPublicOrigin(req: NextRequest) {
  // Prefer an explicit env if you have it (recommended)
  const envOrigin = process.env.APP_PUBLIC_ORIGIN;

  if (envOrigin) return envOrigin.replace(/\/$/, "");

  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host =
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    new URL(req.url).host;

  return `${proto}://${host}`;
}

function redirectBack(origin: string, returnTo: string, status: string) {
  const u = new URL(returnTo || "/home", origin);
  u.searchParams.set("slack", status);
  return NextResponse.redirect(u);
}

export async function GET(req: NextRequest) {
  const origin = getPublicOrigin(req);
  const secure = origin.startsWith("https://");

  const cookieStore = await cookies();
  const returnTo = cookieStore.get(OAUTH_RETURN_TO_COOKIE)?.value ?? "/home";

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code) {
      const res = redirectBack(origin, returnTo, "error");
      return res;
    }

    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sessionId) return NextResponse.redirect(new URL("/login", origin));

    const user = await getMeFromSessionId(sessionId);
    if (!user) return NextResponse.redirect(new URL("/login", origin));

    const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
    if (!state || !expectedState || state !== expectedState) {
      const res = redirectBack(origin, returnTo, "state_mismatch");

      // clear ephemeral cookies (best effort)
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
    }

    await handleCallback({ userId: user.id, code });

    const res = redirectBack(origin, returnTo, "connected");

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
    console.error("Slack callback error", err);

    // IMPORTANT: use origin + returnTo here too (NOT req.url)
    const res = redirectBack(origin, returnTo, "error");

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
  }
}
