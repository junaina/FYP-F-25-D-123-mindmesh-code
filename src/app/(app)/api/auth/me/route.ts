// src/app/(app)/api/auth/me/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";
import { buildSidebarProfile } from "@/modules/user/service/user.service";
export async function GET() {
  const sid = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sid)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const me = await AuthService.getMeFromSessionId(sid);
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // augment with avatar and fallbacks
  const profile = await buildSidebarProfile({
    id: me.id,
    firstName: me.firstName,
    lastName: me.lastName,
    email: me.email,
  });

  return NextResponse.json(
    {
      ...me, // id, firstName, lastName, email, emailVerified, etc.
      avatarUrl: profile.avatarUrl,
      displayName: profile.displayName,
      initials: profile.initials,
      fallbackEmoji: profile.fallbackEmoji,
      fallbackColor: profile.fallbackColor,
    },
    { status: 200 }
  );
}
