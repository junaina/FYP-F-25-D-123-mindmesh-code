import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { getMeFromSessionId } from "@/modules/auth/service/auth.service";
import { buildAuthorizeUrl } from "@/modules/integrations/slack/services/slackAuth.service";

const OAUTH_STATE_COOKIE = "mm_slack_oauth_state";
const OAUTH_RETURN_TO_COOKIE = "mm_slack_oauth_return_to";

function getPublicOrigin(req: NextRequest) {
  const envOrigin = process.env.APP_PUBLIC_ORIGIN;
  if (envOrigin) return envOrigin.replace(/\/$/, "");
  return req.nextUrl.origin.replace(/\/$/, "");
}

function safeReturnTo(raw: string | null) {
  if (!raw) return "/settings/integrations";
  if (raw.startsWith("/")) return raw;
  try {
    const u = new URL(raw);
    return `${u.pathname}${u.search}`;
  } catch {
    return "/settings/integrations";
  }
}

export async function GET(req: NextRequest) {
  const origin = getPublicOrigin(req);
  const secure = origin.startsWith("https://");

  const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionId) return NextResponse.redirect(new URL("/login", origin));

  const user = await getMeFromSessionId(sessionId);
  if (!user) return NextResponse.redirect(new URL("/login", origin));

  const url = new URL(req.url);
  const returnTo = safeReturnTo(url.searchParams.get("returnTo"));

  const state = randomUUID();

  // IMPORTANT: this matches your slackAuth.service.ts (user_scope + SLACK_REDIRECT_URI)
  const authorizeUrl = buildAuthorizeUrl({ state });

  const res = NextResponse.redirect(authorizeUrl);

  // IMPORTANT: set cookies on the RESPONSE (not via cookies().set)
  res.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 10 * 60,
  });

  res.cookies.set(OAUTH_RETURN_TO_COOKIE, returnTo, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 10 * 60,
  });

  return res;
}
