import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { getMeFromSessionId } from "@/modules/auth/service/auth.service";
import { GoogleDriveAuthService } from "@/modules/integrations/googleDrive/services/googleDriveAuth.service";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code) {
      const fallback = new URL(
        "/settings/integrations?googleDrive=error",
        req.url
      );
      return NextResponse.redirect(fallback);
    }

    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sessionId) {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    const user = await getMeFromSessionId(sessionId);
    if (!user) {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    const { redirectUrl } = await GoogleDriveAuthService.handleCallback({
      userId: user.id,
      code,
      state,
    });

    const absolute = new URL(redirectUrl, req.url);
    return NextResponse.redirect(absolute);
  } catch (err) {
    console.error("Google Drive callback error", err);
    const fallback = new URL(
      "/settings/integrations?googleDrive=error",
      req.url
    );
    return NextResponse.redirect(fallback);
  }
}
