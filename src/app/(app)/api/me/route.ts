export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";
import { buildSidebarProfile } from "@/modules/user/service/user.service";
import { UpdateProfileZ } from "@/modules/user/dto/profile.dto";
import { userService } from "@/modules/user/service/user.service";
import { badRequest, ok } from "@/lib/auth/responses";

export async function GET() {
  // Reuse your existing auth flow to get current user
  const sid = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sid)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // This returns: { id, firstName, lastName, email, emailVerified, ... }
  const me = await AuthService.getMeFromSessionId(sid);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Build UI-friendly fields (avatar + fallbacks)
  const profile = await buildSidebarProfile({
    id: me.id,
    firstName: me.firstName,
    lastName: me.lastName,
    email: me.email,
  });

  // Return a clean payload for the sidebar (do NOT change /api/auth/me)
  return NextResponse.json(
    {
      id: me.id,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      initials: profile.initials,
      fallbackEmoji: profile.fallbackEmoji,
      fallbackColor: profile.fallbackColor,
    },
    { status: 200 }
  );
}
export async function PATCH(req: NextRequest) {
  try {
    const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionId) return badRequest("unauthorized");
    const me = await AuthService.getMeFromSessionId(sessionId);
    if (!me) return badRequest("unauthorized");
    const json = await req.json();
    const input = UpdateProfileZ.parse(json);

    const result = await userService.updateProfile(me.id, input);
    return ok(result);
  } catch (err: any) {
    const status = typeof err?.status === "number" ? err.status : 400;
    return badRequest(err?.message ?? "bad_request");
  }
}
